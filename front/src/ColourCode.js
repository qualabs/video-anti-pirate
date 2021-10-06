import React, { Component, Fragment } from 'react';

import './ColourCode.css';

export class ColourCode extends Component {
	constructor(props) {
		super(props);
		this.state = { seq: '' };

		this.colors = {
			NE: ['#000000', '0000'],
			BL: ['#ffffff', '0001'],
			RO: ['#ff0000', '0010'],
			VE: ['#00ff00', '0011'],
			AZ: ['#0000ff', '0100'],
			AM: ['#ffff00', '0101'],
			CY: ['#00ffff', '0110'],
			MA: ['#ff00ff', '0111'],
			NR: ['linear-gradient(45deg, #000 49%, #f00 51%)', '1000'],
			MN: ['linear-gradient(45deg, #f0f 49%, #000 51%)', '1001'],
			NV: ['linear-gradient(45deg, #000 49%, #0f0 51%)', '1010'],
			CN: ['linear-gradient(45deg, #0ff 49%, #000 51%)', '1011'],
			BR: ['linear-gradient(45deg, #fff 49%, #f00 51%)', '1100'],
			MB: ['linear-gradient(45deg, #f0f 49%, #fff 51%)', '1101'],
			BV: ['linear-gradient(45deg, #fff 49%, #0f0 51%)', '1110'],
			CB: ['linear-gradient(45deg, #0ff 49%, #fff 51%)', '1111'],
		};

		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleClick(value) {
		this.setState({ seq: this.state.seq + value });
	}

	handleChange(e) {
		this.setState({ seq: e });
	}

	handleSubmit(e) {
		e.preventDefault();
		let binSeq = [];
		let isValid = true
		this.state.seq.match(/\S+/g).map((seq, index) => {
			if (Object.keys(this.colors).includes(seq)) {
				return index % 2 === 0 ? binSeq.push(this.colors[seq][1]) : (binSeq[binSeq.length - 1] += this.colors[seq][1]);
			} else {
				isValid = false
				this.props.onAlert('The color code is not correct.', 'danger')
				return null
			}
		});

		if (isValid) {
			let sessionId = binSeq.map((bin) => String.fromCharCode(parseInt(bin, 2))).join('');
			this.props.onBan(null, sessionId);

			this.setState({ seq: '' });
		}
	}

	renderColourSeq() {
		return this.state.seq
			.split(' ')
			.filter((seq) => seq.length > 0)
			.map((seq, index) => {
				if (Object.keys(this.colors).includes(seq)) {
					return <div className="color-seq" key={index} style={{ background: this.colors[seq][0] }}></div>;
				} else {
					return <div className="color-seq cross" key={index}></div>;
				}
			});
	}

	render() {
		return (
			<Fragment>
				<form className="mb-3" onSubmit={this.handleSubmit}>
					<div className="form-group">
						<label htmlFor="colorSequence">Color sequence </label>
						<input
							id="colorSequence"
							type="text"
							className="form-control"
							value={this.state.seq}
							onChange={(e) => this.handleChange(e.target.value.toUpperCase())}
						/>
					</div>
				</form>
				<div className="form-group">
					<label>Colors</label>
					<div className="secuencia">
						<div className="color-seq" style={{ background: 'linear-gradient(45deg, #000 49%, #fff 51%)' }}></div>
						{this.renderColourSeq()}
					</div>
				</div>
				<div className="teclado mb-3">
					<button className="btn btn-light color-cont" onClick={() => this.handleClick(' RO ')}>
						<div className="color red"></div>
						<span>RO</span>
					</button>
					<button className="btn btn-light color-cont" onClick={() => this.handleClick(' AZ ')}>
						<div className="color blue"></div>
						<span>AZ</span>
					</button>
					<button className="btn btn-light color-cont" onClick={() => this.handleClick(' BL ')}>
						<div className="color white"></div>
						<span>BL</span>
					</button>
					<button className="btn btn-light color-cont" onClick={() => this.handleClick(' NE ')}>
						<div className="color black"></div>
						<span>NE</span>
					</button>
					<button className="btn btn-light color-cont" onClick={() => this.handleClick(' VE ')}>
						<div className="color green"></div>
						<span>VE</span>
					</button>
					<button className="btn btn-light color-cont" onClick={() => this.handleClick(' AM ')}>
						<div className="color yellow"></div>
						<span>AM</span>
					</button>
					<button className="btn btn-light color-cont" onClick={() => this.handleClick(' MA ')}>
						<div className="color magenta"></div>
						<span>MA</span>
					</button>
					<button className="btn btn-light color-cont" onClick={() => this.handleClick(' CY ')}>
						<div className="color cyan"></div>
						<span>CY</span>
					</button>
					<button className="btn btn-light color-cont" onClick={() => this.handleClick(' NR ')}>
						<div className="color black-red"></div>
						<span>NR</span>
					</button>
					<button className="btn btn-light color-cont" onClick={() => this.handleClick(' MN ')}>
						<div className="color black-magenta"></div>
						<span>MN</span>
					</button>
					<button className="btn btn-light color-cont" onClick={() => this.handleClick(' NV ')}>
						<div className="color black-green"></div>
						<span>NV</span>
					</button>
					<button className="btn btn-light color-cont" onClick={() => this.handleClick(' CN ')}>
						<div className="color black-cyan"></div>
						<span>CN</span>
					</button>
					<button className="btn btn-light color-cont" onClick={() => this.handleClick(' BR ')}>
						<div className="color white-red"></div>
						<span>BR</span>
					</button>
					<button className="btn btn-light color-cont" onClick={() => this.handleClick(' MB ')}>
						<div className="color white-magenta"></div>
						<span>MB</span>
					</button>
					<button className="btn btn-light color-cont" onClick={() => this.handleClick(' BV ')}>
						<div className="color white-green"></div>
						<span>BV</span>
					</button>
					<button className="btn btn-light color-cont" onClick={() => this.handleClick(' CB ')}>
						<div className="color white-cyan"></div>
						<span>CB</span>
					</button>
				</div>
				<button type="submit" className="btn btn-primary btn-block" onClick={this.handleSubmit}>
					<span className="target">&#8982;</span> Ban
				</button>
			</Fragment>
		);
	}
}
