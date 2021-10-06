# Watermarking
As seen on Demuxed! View the talk here.

A customer contacted us and said: "I'm getting my stream stolen in Facebook and Twitch. Next match is in 5 days, can you help?". So we set out to implement a very basic watermarking system for live streaming.

The content is encrypted with Clearkey. The key is periodically rotated. A key server provides the keys to the clients, along with control instructions to the watermarking system.

The watermark itself is done client-side. A plugin for videoJS will display the watermark according to the configuration. Some basic measures are taken to avoid a malicious user from removing the watermark.

If a malicious user tries to restream the match, either by screen sharing or other methods of screen capture (like pointing a camera to the screen), we will find out their session ID, and ban them.

The system is offered as a service. A customer would implement a backend server (reffered here as "3rd party backend"), which is in charge of authenticating the users and giving them a JWT which they will use to fetch the keys from this service. We provide a sample integration.

See INSTALL.md for notes on how to deploy the system.

# Security (or lack of)
The system's security is pretty basic. Most "easy" attacks are defended against. A sufficiently expert malicious user can break the security.

The system takes a token to validate the user's credentials. This token is fixed to the user's IP, so token sharing is limited.

Since the encryption system is Clearkey, this means a user can see the key that's being used. This is mitigated by rotating the keys often enough.

The watermaking is generated and displayed on the client-side. The plugin has anti-debugging measures, and tries to ensure that most simple ways of hiding the watermark are not effective.

# Types of watermarks
The service has 2 kinds of watermarking: full session ID or color-coded session ID.

## Full session ID
The session ID is displayed as a string on a random position on the player. The position changes frequently.
This is very intrusive, but it is the quickest way to find the stream sharer. All it takes is to capture one frame where the session ID is displayed, and the user can be banned.

## Color coded session ID
A configurable box (height, width and position on screen) will display a sequence of colors. This sequence encodes the session ID.
This is a pretty unobtrusive, as it can be configured as small as the stolen stream quality allows, and it can be visually inconspicuous if placed near the game's graphics.

# Architecture
The project consists of:

- Key manager backend (KM)
- Key server (KS)
- Admin Frontend
- VideoJS plugin
- A sample integration

## Database
AWS DynamoDB is used as the backing database. 
There are 2 tables in use, one for keeping the keys and one for keeping control information (current watermaking settings and banned users).

## Key manager
When processing encrypted content, AWS MediaLive will interact with the KM using SPEKE.
The KM will return a PSSH for the clearkey encryption system, and store the key information in dynamoDB.

This lambda is only used internally and only requires access to MediaLive and dynamo, it's implemented in Python.

## Key server
The KS will respond to requests done by clients that are trying to watch the content.
The KS verifies that a valid JWT token was provided and that the user is not banned.

Also, the KS serves as the control API. This API authenticates users by their JWT token.

This lambda is exposed to internet, and accesses dynamo and cloudwatch, it's implemented in Python.


## VideoJS plugin
See the `videojs-anti-pirate` folder for build and usage instructions.

## Admin Frontend
This simple frontend simplifies using the KS API. It allows to change the watermarking config, banning users, and seeing stats.

The frontend is implemented using ReactJS.

## Sample integration
A very simple minimalistic integration, showing what a backend that wishes to use this service needs to do.


# Integration
The backends (Key server and 3rd party backend, or sample integration in this project) communicate using HTTP API calls with a JWT payload. The JWT secret is what authorizes any action on the KS.


## Sample integration
The sample integration is a very small example of what a 3rd party would have to do to integrate with the watermarking system. The bare minimum is implementing the first route `/<resourceId>/<sessionId>`. The other endpoints could be used from the admin site.

Note that this has no security at all, it is intended for testing only!

The sample integration has the following endpoints, all GET only.
### `/<resourceId>/<sessionId>`
The `resourceId` has to match what was configured on MediaPackage.
It will return the full URL to use as the license server URL in the player.
The `sessionId` can be any string. This is the identifier that will be displayed on the player when watermark is on (so try to keep it short :)

### `/config/<value>`
If value is 1 (ie: `/config/1`), it will enable watermarking. Otherwise, it will disable it.

### `/ban/<sessionId>`
It will ban the given `sessionId`

# Database
## Control table

The control table has a key named "sessionId". 

In the sessionId "control", we store if the watermaking is enabled, and if so, which options it is using (see types of watermarks).

All other sessionIds in the table indicate banned users. Users may be banned by the sessionId (which is created in the 3rd party backend), or by using IP. IPs are (confusingly) also stored as a sessionId.

## Key table
The key table contains "content_id", "kid" (key id), "iv" (initialization vector), "keyPeriod", "index", "key" and "expiry".

Expiry is used to auto-clean the database. Dynamo can be configured to delete entries older than x time.


# License
MIT. Copyright Qualabs