import videojs from "video.js";
import "videojs-contrib-eme";
import { version as VERSION } from "../package.json";
import {
  base64ToArrayBuffer,
  idWatermarking,
  colorWatermarking,
  makeId,
} from "./utils";
import devtools from "devtools-detect";
import axios from "axios";


const Plugin = videojs.getPlugin("plugin");

// Default options for the plugin.
const defaults = {};

/**
 * Anti-pirate Videojs plugin
 * See: https://github.com/qualabs/video-anti-pirate
 */
class AntiPirate extends Plugin {
  /**
   * Create a AntiPirate plugin instance.
   * @param  {Player} player - A Video.js Player instance.
   * @param  {Object} [options]
   */
  constructor(player, options) {
    // the parent class will add player under this.player
    super(player);
    this.options = videojs.mergeOptions(defaults, options);

    this.sessionId = null;
    this.npInterval = null;
    this.wmOptions = null;

    this.idWmInterval = null;
    this.colorWmInterval = null;

    // BUG: If the player is on a iframe devtoolschange is triggered
    window.addEventListener('devtoolschange', event => {
      if (event.detail.isOpen) {
        player.reset();
        player.error("Can't continue playing video");
      }
    });

    // Disable PiP as we can not show player controls on Chrome. 
    this.player.on("enterpictureinpicture", () => {
      document.exitPictureInPicture();
    });

    this.player.on("onlicencereceived", (e) => {
      if (this.sessionId && this.player.hasStarted()) {
        const markId = makeId(5);
        if (
          (!this.wmOptions || this.wmOptions.type === "id") &&
          !this.idWmInterval
        ) {
          clearInterval(this.colorWmInterval);
          this.colorWmInterval = null;
          const idInterval = idWatermarking(player, markId, this.sessionId);
          this.idWmInterval = idInterval;
        } else if (this.wmOptions.type === "color" && !this.colorWmInterval) {
          clearInterval(this.idWmInterval);
          this.idWmInterval = null;

          const colorInterval = colorWatermarking(
            player,
            markId,
            this.sessionId,
            this.wmOptions
          );

          this.colorWmInterval = colorInterval;
        }
      }
    });

    this.player.on("playing", () => {
      this.player.trigger("onlicencereceived");
    });

    this.player.ready(() => {
      player.eme();

      // Remove PiP button
      const pipChild = player.controlBar.getChild("PictureInPictureToggle");
      if (pipChild) {
        player.controlBar.removeChild(pipChild);
      }
    });
  }

  /**
   * @typedef scrObj
   * @type {object}
   * @property {string} src - URL of the video 
   * @property {string} token - a JWT returned by the server 
   * @property {string} server - URL of the license server 
   */

  /**
   * Get the license 
   * @param {scrObj} srcObj - Object with src, token and server information
   * @param {string} tech - one of 'np', 'ck', or 'widevine'
   * @returns {function} - videojs-contrib-eme getLicense function
   */
  getLicence(srcObj, tech) {
    return (emeOptions, keyMessage, callback) => {
      return axios
        .post(
          `${srcObj.server}/${tech}/?token=${srcObj.token}`,
          keyMessage
        )
        .then((response) => {
          this.sessionId = response.data.watermarking
            ? response.data.sessionId
            : null;
          this.wmOptions = response.data.watermarking
            ? response.data.wmOptions
            : null;
          this.player.trigger("onlicencereceived");
          if (callback) {
            callback(null, base64ToArrayBuffer(response.data.license));
          }
        })
        .catch((error) => {
          if (callback) {
            callback(error);
          }
          this.player.reset();
          this.player.error("Can't continue playing video, invalid license");
          this.player.trigger("hidewatermarking");

          if (!callback) {
            throw error;
          }
        });
    };
  }

  /**
   * set the video source objeect
   * @param {srcObj} srcObj - Object with src, token and server information
   */
  src(srcObj) {
    // BUG: If the player is on a iframe devtoolschange is triggered
    if (devtools.isOpen) {
      this.player.error("Can't continue playing video");
      return;
    }

    clearInterval(this.npInterval);

    if (typeof srcObj === "string") {
      this.player.src(srcObj);
      return;
    }

    // HLS
    if (srcObj.src.indexOf("m3u8") > 0) {
      this.getLicence(srcObj, "np")().then(() => {
        this.player.src(srcObj.src);
        this.npInterval = setInterval(() => {
          this.getLicence(srcObj, "np")();
        }, 60000);
      });
      return;
    }

    // Dash
    if (srcObj.src.indexOf("mpd") > 0) {
      this.player.src({
        src: srcObj.src,
        type: "application/dash+xml",
        keySystems: {
          "org.w3.clearkey": {
            getLicense: this.getLicence(srcObj, "ck"),
          },
          'com.widevine.alpha': {
            supportedConfigurations: [{
              videoCapabilities: [{
                contentType: 'video/webm; codecs="vp9"',
                robustness: 'SW_SECURE_CRYPTO'
              }],
              audioCapabilities: [{
                contentType: 'audio/webm; codecs="vorbis"',
                robustness: 'SW_SECURE_CRYPTO'
              }]
            }],
            getLicense: this.getLicence(srcObj, 'widevine')
          }
        },
      });
    }
  }
}

// Define default values for the plugin's `state` object here.
AntiPirate.defaultState = {};

// Include the version number.
AntiPirate.VERSION = VERSION;

// Register the plugin with video.js.
videojs.registerPlugin("antiPirate", AntiPirate);

export default AntiPirate;
