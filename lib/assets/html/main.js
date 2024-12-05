export function init(ctx, payload) {
	console.log("init", ctx, payload);
	ctx.importCSS("main.css");

	ctx.root.innerHTML = `
	  <div class="container">
		<div class="url-bar">
			<div class="url-input-container">
				<span class="websocket-icon">⚡</span>
				<input type="text" id="endpoint" placeholder="Enter websocket URL..." value="${payload.endpoint}">
			</div>
			<button id="connect" class="connect-button">Connect 🔗</button>
		</div>
		<div class="tabs">
			<button class="tab active" data-tab="message">Message</button>
			<button class="tab" data-tab="headers">Headers</button>
			<button class="tab" data-tab="settings">Settings</button>
		</div>
		<div class="tab-content">
			<div id="message-tab" class="tab-pane active">
				<div class="message-container">
					<div class="input-area">
						<textarea id="input" placeholder="Compose message"></textarea>
						<button id="send" class="send-button" disabled>Send</button>
					</div>
					<div class="message-history">
						<div id="messagesDisplay"></div>
					</div>
				</div>
			</div>
			<div id="headers-tab" class="tab-pane">
				<div class="headers-container">
					<table class="headers-table" id="headers-table">
						<thead><tr><th>Key</th><th>Value</th><th>Actions</th></tr></thead>
						<tbody>
							<!--
							<tr class="header-row">
								<td><input type="text" class="header-key" placeholder="Header key"></td>
								<td><input type="text" class="header-value" placeholder="Header value"></td>
								<td class="actions">
									<button class="icon-button add-header">➕</button>
									<button class="icon-button remove-header">❌</button>
								</td>
							</tr>
							-->
						</tbody>
					</table>
				</div>
			</div>
			<div id="settings-tab" class="tab-pane">
				<div class="settings-container">
					<div class="setting-item">
					<label>
						<input type="checkbox" id="show-timestamps" checked>
						Show timestamps in messages
					</label>
					</div>
				</div>
			</div>
		</div>
	  </div>
	`;

	function headerRowHTML(key, value) {
		return `
			<tr class="header-row">
				<td><input type="text" class="header-key" placeholder="Header key" value="${key}" ></td>
				<td><input type="text" class="header-value" placeholder="Header value" value="${value}"></td>
				<td class="actions">
					<button class="icon-button add-header">➕</button>
					<button class="icon-button remove-header">❌</button>
				</td>
			</tr>
		`;
	}

	const state = {
		endpoint: payload.endpoint || "wss://echo.websocket.org/?encoding=text",
		extra_headers: payload.extra_headers || [],
		settings: {
			show_timestamps: payload.settings?.show_timestamps || true
		},
		connected: payload.connected || false
	};
	const endpoint = ctx.root.querySelector("#endpoint");
	const connectBtn = ctx.root.querySelector("#connect");
	const tabs = ctx.root.querySelectorAll(".tab");
	const tabPanes = ctx.root.querySelectorAll(".tab-pane");
	const input = ctx.root.querySelector("#input");
	const messagesDiv = ctx.root.querySelector("#messagesDisplay");
	const sendBtn = ctx.root.querySelector("#send");

	function setupTabs() {
		tabs.forEach(tab => {
			tab.addEventListener("click", (e) => {
				const tabName = tab.getAttribute("data-tab");

				tabs.forEach(tab => tab.classList.remove("active"));
				tabPanes.forEach(pane => pane.classList.remove("active"));

				const selectedTab = ctx.root.querySelector(`[data-tab="${tabName}"]`);
				const selectedPane = ctx.root.querySelector(`#${tabName}-tab`);

				if (selectedTab && selectedPane) {
					selectedTab.classList.add("active");
					selectedPane.classList.add("active");
				}
			});
		});
	}

	function setupEndpoint() {
		endpoint.value = state.endpoint;
		endpoint.setAttribute("value", state.endpoint);
	}

	function setupHeadersTable() {
		// const headersTable = document.getElementById("headers-table");
		const headersTable = ctx.root.querySelector("#headers-table tbody");

		// Clear existing rows except header
		while (headersTable.rows.length > 1) {
			headersTable.deleteRow(1);
		}

		headersTable.addEventListener("click", (e) => {
			const button = e.target.closest("button");
			if (!button) return;
			if (button.classList.contains("add-header")) {
				const row = button.closest("tr");
				const newRow = row.cloneNode(true);
				newRow.querySelectorAll("input").forEach(input => {
					input.value = "";
					input.setAttribute("value", "");
				});
				row.parentNode.insertBefore(newRow, row.nextSibling);
				updateHeaders();
			} else if (button.classList.contains("remove-header")) {
				const row = button.closest("tr");
				const tbody = row.parentNode;
				if (tbody.children.length > 1) {
					button.closest("tr").remove();
					updateHeaders();
				}
			}
		});

		headersTable.addEventListener("input", updateHeaders);

		if (state.extra_headers.length == 0) {
			state.extra_headers.push(["", ""]);
		}

		state.extra_headers.forEach(([key, value]) => {
			const template = document.createElement('template');
			template.innerHTML = headerRowHTML(key, value);
			headersTable.appendChild(template.content.firstElementChild);
		});
	}

	function setupSettings() {
		const showTimestamps = ctx.root.querySelector("#show-timestamps");

		[showTimestamps].forEach(element => {
			element.addEventListener("change", () => {
				state.settings = {
					show_timestamps: showTimestamps.checked
				};
				ctx.pushEvent("update_settings", { settings: state.settings });
			});
		});
	}

	function updateHeaders() {
		const extra_headers = [];
		ctx.root.querySelectorAll(".header-row").forEach(row => {
			const key = row.querySelector(".header-key").value.trim();
			const value = row.querySelector(".header-value").value.trim();
			if (key) {
				extra_headers.push([key, value]);
			}
		});
		state.extra_headers = extra_headers;
		ctx.pushEvent("update_headers", { extra_headers });
	}

	setupTabs();
	setupEndpoint();
	setupHeadersTable();
	setupSettings();

	connectBtn.addEventListener("click", () => {
		if (state.connected) {
			ctx.pushEvent("disconnect", {});
		} else {
			ctx.pushEvent("connect", { endpoint: endpoint.value });
		}
	});

	sendBtn.addEventListener("click", () => {
		if (state.connected && input.value) {
			ctx.pushEvent("send", { message: input.value });
			input.value = "";
		}
	});

	function appendMessage(type, content) {
		const showTimestamps = ctx.root.querySelector("#show-timestamps").checked;
		const timestamp = showTimestamps ? new Date().toLocaleTimeString() + " " : "";

		var messageDiv = document.createElement('div');
		messageDiv.className = 'message';

		// Other funky emoji icons: ♻️✅⬆️⬇️🔃🔄️🔗⛓️‍💥
		var icon;
		if (type === 'sent') {
			icon = '⬆️';
		} else if (type === 'received') {
			icon = '⬇️';
		} else if (type === 'connected') {
			icon = '🔗';
		} else if (type === 'disconnected') {
			icon = '⛓️‍💥';
		} else if (type === 'error') {
			icon = '💥';
		} else {
			icon = '✅';
		}

		messageDiv.innerHTML = icon +
			'<pre class="message-content">' + content + '</pre>' +
			'<span class="message-timestamp">' + timestamp + '</span>';

		// Insert new message at the top of the list
		if (messagesDiv.firstChild) {
			messagesDiv.insertBefore(messageDiv, messagesDiv.firstChild);
		} else {
			messagesDiv.appendChild(messageDiv);
		}
	}

	function updateConnectionStatus(endpoint, connected) {
		connectBtn.textContent = connected ? "Disconnect" : "Connect";
		sendBtn.disabled = !connected;
		if (connected) {
			connectBtn.classList.add("connected");
			appendMessage('connected', "Connected to " + endpoint);
		} else {
			connectBtn.classList.remove("connected");
			appendMessage('disconnected', "Disconnected from " + endpoint);
		}
		state.connected = connected;
	}

	ctx.handleEvent("connected", ({ endpoint, conn }) => { updateConnectionStatus(endpoint, true, conn); });
	ctx.handleEvent("disconnected", ({ endpoint }) => updateConnectionStatus(endpoint, false));
	ctx.handleEvent("sent", ({ message }) => { appendMessage('sent', message); });
	ctx.handleEvent("received", ({ type, message }) => { appendMessage('received', type + ": " + message); });
	ctx.handleEvent("error", ({ message }) => { appendMessage('error', message); });
}
