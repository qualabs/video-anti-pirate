import React, { useState, useEffect, useCallback, Fragment } from 'react';
import './App.css';
import jwt from 'jsonwebtoken';

import { ColourCode } from './ColourCode';

const BASE = process.env.REACT_APP_KEYSERVER

function App() {
	const [password, setPassword] = useState('');
	const [passwordOk, setPasswordOk] = useState(false);
	const [passwordInput, setPasswordInput] = useState('');
	const [toBan, setToBan] = useState('');
	const [config, setConfig] = useState({
		watermarking: false,
		banned: [],
		wmOptions: { type: 'id' },
	});
	const [imgUrl, setImgUrl] = useState();
	const [wmType, setWmType] = useState('id');
	const [customAlert, setCustomAlert] = useState({ hide: true, message: '', type: 'primary' });
	const update = () => {
		if (password) {
			fetch(BASE + '/get/', {
				method: 'POST',
				body: jwt.sign({}, password),
			})
				.then((res) => res.json())
				.then(setConfig)
				.then(() => setPasswordOk(true))
				.then(() => setCustomAlert('Password ok', 'success'))
				.catch(() => setCustomAlert('Incorrect password', 'danger'));
		}
	};

	const updateImg = () => {
		if (password) {
			setImgUrl(BASE + '/graph/?token=' + jwt.sign({}, password) + '&t=' + Date.now());
		}
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		setPassword(passwordInput);
		return false;
	};
	useEffect(update, [password]);
	useEffect(updateImg, [password]);

	const updateBan = (item, ban) => {
		fetch(BASE + '/ban/', {
			method: 'POST',
			body: jwt.sign({ ban, sessionId: item }, password),
		}).then(update);
	};

	const flipWatermark = () => {
		fetch(BASE + '/config/', {
			method: 'POST',
			body: jwt.sign({ watermarking: !config['watermarking'], wmOptions: config['wmOptions'] }, password),
		}).then(update);
	};

	const setWmOption = (prop, value) => {
		setConfig({
			...config,
			wmOptions: { ...config['wmOptions'], [prop]: value },
		});
	};

	const handleSubmitConfig = (e) => {
		e.preventDefault();
		fetch(BASE + '/config/', {
			method: 'POST',
			body: jwt.sign({ watermarking: config['watermarking'], wmOptions: config['wmOptions'] }, password),
		})
			.then(update)
			.then(() => setAlert('Configuration successfully applied', 'success'))
			.catch(() => setAlert('There was a problem updating the configuration', 'danger'));
	};

	const handleSubmitBan = (e, sessionId) => {
		if (e) {
			e.preventDefault();
		}
		let target = toBan;
		if (sessionId) {
			target = sessionId;
		}
		fetch(BASE + '/ban/', {
			method: 'POST',
			body: jwt.sign({ ban: true, sessionId: target }, password),
		})
			.then(update)
			.then(() => setAlert('User blocked.', 'success'))
			.catch(() => setAlert('Error blocking user.', 'danger'));
		return false;
	};

	const memoUpdateImg = useCallback(updateImg);
	const memoUpdate = useCallback(update);
	useEffect(() => {
		const interval = setInterval(() => {
			memoUpdateImg();
			memoUpdate();
		}, 60000);
		return () => clearInterval(interval);
	}, [password, memoUpdateImg, memoUpdate]);

	const setAlert = (message, type) => {
		setCustomAlert({ hide: false, message, type });
		setTimeout(() => {
			setCustomAlert({ ...customAlert, hide: true });
		}, 4000);
	};

	return (
		<div className="container">
			<div hidden={customAlert['hide']} className={`alert-cont alert alert-${customAlert['type']}`} role="alert">
				{customAlert['message']}
			</div>
			<div className="row">
				<div className="col-sm-12 p-2">
					<div className="card">
						<div className="card-body d-flex justify-content-between align-items-center">
							<h1 className="display-4">Watermarking</h1>

							<div className="pr-4">
								{passwordOk && (
									<label className="switch pr-4">
										<input type="checkbox" checked={config['watermarking']} onChange={flipWatermark} />
										<span className="slider round"></span>
									</label>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="row">
				<div className="col-md-12 p-2">
					<div className="card">
						<input type="checkbox" className="toggle" id="passwordSection" defaultChecked />
						<label htmlFor="passwordSection" className="card-header">
							<h4 className="d-flex justify-content-between">
								Authentication <span className="up-chevron pointer">&#10095;</span>
							</h4>
						</label>
						<div className="collapsible-content">
							<div className="card-body">
								<form onSubmit={handleSubmit} className="mb-3">
									<label>Password</label>
									<div className="password-input form-group">
										<input
											type="password"
											className="form-control"
											id="password"
											onChange={(e) => {
												setPasswordInput(e.target.value);
											}}
										/>
										{passwordOk ? (
											<span className="badge badge-success password-ok">&#10003;</span>
										) : (
											<span className="badge badge-danger password-ok">&#10005;</span>
										)}
									</div>
									<button type="submit" className="btn btn-primary">
										Login
									</button>
								</form>
							</div>
						</div>
					</div>
				</div>
				{passwordOk && (
					<Fragment>
						<div className="col-md-12 p-2">
							<div className="card">
								<input type="checkbox" className="toggle" id="configSection" defaultChecked />
								<label htmlFor="configSection" className="card-header">
									<h4 className="d-flex justify-content-between">
										Configuration
										<span className="up-chevron pointer">&#10095;</span>
									</h4>
								</label>
								<div className="collapsible-content">
									<div className="card-body">
										<form onSubmit={handleSubmitConfig} className="mb-3">
											<label>Type</label>
											<div className="form-group">
												<div className="form-check form-check-inline">
													<input
														className="form-check-input"
														type="radio"
														name="watermarkingType"
														id="idWm"
														value="id"
														onChange={(e) => setWmOption('type', e.target.value)}
														checked={config['wmOptions']['type'] === 'id'}
													/>
													<label className="form-check-label" htmlFor="idWm">
														use Session ID
													</label>
												</div>
												<div className="form-check form-check-inline">
													<input
														className="form-check-input"
														type="radio"
														name="watermarkingType"
														id="colorWm"
														value="color"
														onChange={(e) => setWmOption('type', e.target.value)}
														checked={config['wmOptions']['type'] === 'color'}
													/>
													<label className="form-check-label" htmlFor="colorWm">
														use Colors
													</label>
												</div>
											</div>
											{config['wmOptions']['type'] === 'color' && (
												<div className="form-group row d-flex align-items-center">
													<div className="col">
														<label> Height </label>
														<div className="input-group">
															<input
																type="number"
																className="form-control"
																required
																onChange={(e) => setWmOption('height', e.target.value)}
																value={config['wmOptions']['height'] || ''}
															/>
															<div className="input-group-append">
																<span className="input-group-text">px</span>
															</div>
														</div>
													</div>
													<div className="col">
														<label> Width </label>
														<div className="input-group">
															<input
																type="number"
																className="form-control"
																required
																onChange={(e) => setWmOption('width', e.target.value)}
																value={config['wmOptions']['width'] || ''}
															/>
															<div className="input-group-append">
																<span className="input-group-text">px</span>
															</div>
														</div>
													</div>
													<div className="col">
														<label> x (left) </label>
														<div className="input-group">
															<input
																type="number"
																className="form-control"
																required
																onChange={(e) => setWmOption('x', e.target.value)}
																value={config['wmOptions']['x'] || ''}
															/>
															<div className="input-group-append">
																<span className="input-group-text">%</span>
															</div>
														</div>
													</div>
													<div className="col">
														<label> y (right)</label>
														<div className="input-group">
															<input
																type="number"
																className="form-control"
																required
																onChange={(e) => setWmOption('y', e.target.value)}
																value={config['wmOptions']['y'] || ''}
															/>
															<div className="input-group-append">
																<span className="input-group-text">%</span>
															</div>
														</div>
													</div>
												</div>
											)}

											<button type="submit" className="btn btn-primary">
												Apply
											</button>
										</form>
									</div>
								</div>
							</div>
						</div>

						<div className="col-md-12 p-2">
							<div className="card">
								<input type="checkbox" id="monitSection" className="toggle" defaultChecked />
								<label htmlFor="monitSection" className="card-header">
									<h4 className="d-flex justify-content-between">
										Monitoring
										<span className="up-chevron pointer">&#10095;</span>
									</h4>
								</label>
								<div className="collapsible-content">
									<div className="card-body">
										<img alt="" src={imgUrl} />
									</div>
								</div>
							</div>
						</div>

						<div className="col-md-12 p-2">
							<div className="card">
								<input type="checkbox" className="toggle" id="banSection" defaultChecked />
								<label htmlFor="banSection" className="card-header">
									<h4 className="d-flex justify-content-between">
										Blocked users <span className="up-chevron pointer">&#10095;</span>
									</h4>
								</label>
								<div className="collapsible-content">
									<div className="card-body row">
										<div className="col-6">
											<div className="form-group">
												<div className="btn-group btn-group-sm" role="group" aria-label="wmType">
													<button type="button" className="btn btn-link" onClick={() => setWmType('id')}>
														Session ID
													</button>
													<button type="button" className="btn btn-link" onClick={() => setWmType('color')}>
														Colors
													</button>
												</div>
											</div>
											<hr />
											{wmType === 'id' ? (
												<form onSubmit={handleSubmitBan}>
													<div className="form-group">
														<label htmlFor="sessionId">Session ID</label>
														<input
															type="text"
															className="form-control"
															id="sessionId"
															onChange={(e) => {
																setToBan(e.target.value);
															}}
														/>
													</div>
													<button type="submit" className="btn btn-primary">
														<span className="target">&#8982;</span> Ban
													</button>
												</form>
											) : (
												<ColourCode onBan={handleSubmitBan} onAlert={setAlert} />
											)}
										</div>
										<div className="col-6 wm-table">
											<table className="table">
												<thead>
													<tr>
														<th scope="col">sessionId or IP</th>
														<th scope="col">IP</th>
														<th scope="col"></th>
													</tr>
												</thead>
												<tbody>
													{config.banned.map((item) => {
														return (
															<tr key={item.sessionId.S}>
																<td>{item.sessionId.S}</td>
																<td>{item.userIP ? item.userIP.S : ''}</td>
																<td>
																	<button
																		onClick={() => updateBan(item.sessionId.S, false)}
																		className="btn btn-danger">
																		&#10005;
																	</button>
																</td>
															</tr>
														);
													})}
												</tbody>
											</table>
										</div>
									</div>
								</div>
							</div>
						</div>
					</Fragment>
				)}
			</div>
		</div>
	);
}

export default App;
