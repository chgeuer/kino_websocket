import "./main.css";

export function init(ctx, payload) {
	ctx.importCSS("main.css");
	// ctx.importCSS("https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap");
	// ctx.importCSS("https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap");
	
	ctx.root.innerHTML = `
	<div class="flex flex-col gap-3 p-4 bg-white">
        <!-- URL Bar -->
        <div class="flex gap-2">
          <div class="flex-grow flex items-center bg-white rounded">
            <span class="px-3 py-2 text-orange-500">⚡</span>
            <input type="text" id="endpoint" placeholder="Enter websocket URL..." value="wss://echo.websocket.org/?encoding=text"
              class="flex-grow bg-transparent px-2 py-2 text-sm border-none focus:outline-none" />
          </div>
		  <button id="connect"
			class="px-4 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-sm data-[connected=true]:bg-red-500 data-[connected=true]:text-white data-[connected=true]:border-red-500">
			Connect
		  </button>
        </div>

        <!-- Tabs -->
        <div class="flex gap-4 border-b border-gray-200">
          <button
            class="px-1 py-2 text-sm text-gray-700 border-b-2 border-transparent hover:border-gray-300 data-[active=true]:border-orange-500 data-[active=true]:text-gray-900"
            data-active="true" data-tab="message">Message</button>
          <button
            class="px-1 py-2 text-sm text-gray-700 border-b-2 border-transparent hover:border-gray-300 data-[active=true]:border-orange-500 data-[active=true]:text-gray-900"
            data-tab="headers">Headers</button>
          <button
            class="px-1 py-2 text-sm text-gray-700 border-b-2 border-transparent hover:border-gray-300 data-[active=true]:border-orange-500 data-[active=true]:text-gray-900"
            data-tab="settings">Settings</button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
			<!-- Message Tab -->
			<div id="message-tab" class="tab-pane" data-active="true">
			<div class="flex flex-col gap-4">
				<!-- Input Area -->
				<div class="flex flex-col gap-2">
					<textarea id="input" placeholder="Compose message"
						class="w-full min-h-[120px] p-3 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:border-gray-400 font-mono"
					></textarea>
					<div class="flex justify-end">
						<button id="send" disabled
						class="px-4 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-sm disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200">
						Send
						</button>
					</div>
				</div>

				<!-- Messages History -->
				<div class="border border-gray-300 rounded bg-gray-50">
				<div id="messagesDisplay" class="min-h-[200px] p-3 font-mono text-sm"></div>
				</div>
			</div>
		</div>

          <!-- Headers Tab -->
          <div id="headers-tab" class="tab-pane hidden">
            <div class="py-4">
              <table class="w-full" id="headers-table">
                <thead>
                  <tr class="text-left text-sm text-gray-600">
                    <th class="font-medium py-2">Key</th>
                    <th class="font-medium py-2">Value</th>
                    <th class="font-medium py-2 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Settings Tab -->
          <div id="settings-tab" class="tab-pane hidden">
            <div class="py-4">
              <label class="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" id="show-timestamps" checked
                  class="rounded border-gray-300 text-gray-600 focus:ring-gray-400">
                Show timestamps in messages
              </label>
            </div>
          </div>
        </div>
      </div>
	`;

	function headerRowHTML(key, value) {
		return `
			<tr class="border-t border-gray-100">
				<td class="py-1">
					<input type="text" placeholder="Header key" value="${key}"
						class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-400">
				</td>
				<td class="py-1">
					<input type="text" placeholder="Header value" value="${value}"
						class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-400">
				</td>
				<td class="py-1">
					<div class="flex gap-2">
						<button class="text-gray-400 hover:text-gray-600" data-action="add">➕</button>
						<button class="text-gray-400 hover:text-gray-600" data-action="remove">❌</button>
					</div>
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
	const endpoint = ctx.root.querySelector("#endpoint"); // OK
	const connectBtn = ctx.root.querySelector("#connect"); // ok
	const tabs = document.querySelectorAll('[data-tab]');
	const input = ctx.root.querySelector("#input"); // ok
	const messagesDiv = ctx.root.querySelector("#messagesDisplay");
	const sendBtn = ctx.root.querySelector("#send"); // ok

	function setupTabs() {
		tabs.forEach(tab => {
		  tab.addEventListener('click', () => {
			// Remove active state from all tabs
			tabs.forEach(t => t.setAttribute('data-active', 'false'));
			// Set active state on clicked tab
			tab.setAttribute('data-active', 'true');
	  
			// Hide all tab panes
			document.querySelectorAll('.tab-pane').forEach(pane => {
			  pane.classList.add('hidden');
			});
	  
			// Show selected tab pane
			const targetPane = document.getElementById(`${tab.dataset.tab}-tab`);
			targetPane.classList.remove('hidden');
		  });
		});	  
	}

	function setupEndpoint() {
		endpoint.value = state.endpoint;
		endpoint.setAttribute("value", state.endpoint);
	}

	function setupHeadersTable() {
		const headersTable = ctx.root.querySelector("#headers-table tbody");
	
		// Clear existing rows except header
		while (headersTable.rows.length > 1) {
			headersTable.deleteRow(1);
		}
	
		headersTable.addEventListener("click", (e) => {
			const button = e.target.closest("button");
			if (!button) return;
			
			if (button.dataset.action === "add") {
				const row = button.closest("tr");
				const template = document.createElement('template');
				template.innerHTML = headerRowHTML("", "");
				row.parentNode.insertBefore(template.content.firstElementChild, row.nextSibling);
				updateHeaders();
			} else if (button.dataset.action === "remove") {
				const row = button.closest("tr");
				const tbody = row.parentNode;
				if (tbody.children.length > 1) {
					row.remove();
					updateHeaders();
				}
			}
		});
	
		headersTable.addEventListener("input", updateHeaders);
	
		if (state.extra_headers.length === 0) {
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
		// Select all rows in the headers table except the header row
		ctx.root.querySelectorAll("#headers-table tbody tr").forEach(row => {
			const key = row.querySelector('input[placeholder="Header key"]').value.trim();
			const value = row.querySelector('input[placeholder="Header value"]').value.trim();
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
	
		const messageDiv = document.createElement('div');
		messageDiv.className = 'flex items-start gap-2 p-2 hover:bg-gray-100 rounded group';
	
		// Define icon and its color based on message type
		let iconElement;
		switch (type) {
			case 'sent':
				iconElement = '<span class="text-orange-500 mt-0.5">⬆️</span>';
				break;
			case 'received':
				iconElement = '<span class="text-blue-500 mt-0.5">⬇️</span>';
				break;
			case 'connected':
				iconElement = '<span class="text-green-500 mt-0.5">🔗</span>';
				break;
			case 'disconnected':
				iconElement = '<span class="text-red-500 mt-0.5">⛓️‍💥</span>';
				break;
			case 'error':
				iconElement = '<span class="text-red-500 mt-0.5">💥</span>';
				break;
			default:
				iconElement = '<span class="text-green-500 mt-0.5">✅</span>';
		}
	
		messageDiv.innerHTML = `
			${iconElement}
			<pre class="flex-1 font-mono text-sm text-gray-700 whitespace-pre-wrap break-words">${content}</pre>
			${showTimestamps ? `<span class="text-xs text-gray-400 mt-1 opacity-0 group-hover:opacity-100">${timestamp}</span>` : ''}
		`;
	
		// Insert new message at the top of the list
		if (messagesDiv.firstChild) {
			messagesDiv.insertBefore(messageDiv, messagesDiv.firstChild);
		} else {
			messagesDiv.appendChild(messageDiv);
		}
	}
	
	function updateConnectionStatus(endpoint, connected) {
		connectBtn.textContent = connected ? "Disconnect" : "Connect";
		connectBtn.setAttribute('data-connected', connected);
		sendBtn.disabled = !connected;
		if (connected) {
			appendMessage('connected', "Connected to " + endpoint);
		} else {
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
