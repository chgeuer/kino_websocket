function k(a,c){var f;a.importCSS("main.css"),a.root.innerHTML=`
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
	`;function h(e,t){return`
			<tr class="border-t border-gray-100">
				<td class="py-1">
					<input type="text" placeholder="Header key" value="${e}"
						class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-400">
				</td>
				<td class="py-1">
					<input type="text" placeholder="Header value" value="${t}"
						class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-400">
				</td>
				<td class="py-1">
					<div class="flex gap-2">
						<button class="text-gray-400 hover:text-gray-600" data-action="add">➕</button>
						<button class="text-gray-400 hover:text-gray-600" data-action="remove">❌</button>
					</div>
				</td>
			</tr>
		`}const n={endpoint:c.endpoint||"wss://echo.websocket.org/?encoding=text",extra_headers:c.extra_headers||[],settings:{show_timestamps:((f=c.settings)==null?void 0:f.show_timestamps)||!0},connected:c.connected||!1},p=a.root.querySelector("#endpoint"),u=a.root.querySelector("#connect"),m=document.querySelectorAll("[data-tab]"),b=a.root.querySelector("#input"),l=a.root.querySelector("#messagesDisplay"),v=a.root.querySelector("#send");function x(){m.forEach(e=>{e.addEventListener("click",()=>{m.forEach(s=>s.setAttribute("data-active","false")),e.setAttribute("data-active","true"),document.querySelectorAll(".tab-pane").forEach(s=>{s.classList.add("hidden")}),document.getElementById(`${e.dataset.tab}-tab`).classList.remove("hidden")})})}function w(){p.value=n.endpoint,p.setAttribute("value",n.endpoint)}function E(){const e=a.root.querySelector("#headers-table tbody");for(;e.rows.length>1;)e.deleteRow(1);e.addEventListener("click",t=>{const s=t.target.closest("button");if(s){if(s.dataset.action==="add"){const r=s.closest("tr"),o=document.createElement("template");o.innerHTML=h("",""),r.parentNode.insertBefore(o.content.firstElementChild,r.nextSibling),g()}else if(s.dataset.action==="remove"){const r=s.closest("tr");r.parentNode.children.length>1&&(r.remove(),g())}}}),e.addEventListener("input",g),n.extra_headers.length===0&&n.extra_headers.push(["",""]),n.extra_headers.forEach(([t,s])=>{const r=document.createElement("template");r.innerHTML=h(t,s),e.appendChild(r.content.firstElementChild)})}function S(){const e=a.root.querySelector("#show-timestamps");[e].forEach(t=>{t.addEventListener("change",()=>{n.settings={show_timestamps:e.checked},a.pushEvent("update_settings",{settings:n.settings})})})}function g(){const e=[];a.root.querySelectorAll("#headers-table tbody tr").forEach(t=>{const s=t.querySelector('input[placeholder="Header key"]').value.trim(),r=t.querySelector('input[placeholder="Header value"]').value.trim();s&&e.push([s,r])}),n.extra_headers=e,a.pushEvent("update_headers",{extra_headers:e})}x(),w(),E(),S(),u.addEventListener("click",()=>{n.connected?a.pushEvent("disconnect",{}):a.pushEvent("connect",{endpoint:p.value})}),v.addEventListener("click",()=>{n.connected&&b.value&&(a.pushEvent("send",{message:b.value}),b.value="")});function i(e,t){const s=a.root.querySelector("#show-timestamps").checked,r=s?new Date().toLocaleTimeString()+" ":"",o=document.createElement("div");o.className="flex items-start gap-2 p-2 hover:bg-gray-100 rounded group";let d;switch(e){case"sent":d='<span class="text-orange-500 mt-0.5">⬆️</span>';break;case"received":d='<span class="text-blue-500 mt-0.5">⬇️</span>';break;case"connected":d='<span class="text-green-500 mt-0.5">🔗</span>';break;case"disconnected":d='<span class="text-red-500 mt-0.5">⛓️‍💥</span>';break;case"error":d='<span class="text-red-500 mt-0.5">💥</span>';break;default:d='<span class="text-green-500 mt-0.5">✅</span>'}o.innerHTML=`
			${d}
			<pre class="flex-1 font-mono text-sm text-gray-700 whitespace-pre-wrap break-words">${t}</pre>
			${s?`<span class="text-xs text-gray-400 mt-1 opacity-0 group-hover:opacity-100">${r}</span>`:""}
		`,l.firstChild?l.insertBefore(o,l.firstChild):l.appendChild(o)}function y(e,t){u.textContent=t?"Disconnect":"Connect",u.setAttribute("data-connected",t),v.disabled=!t,t?i("connected","Connected to "+e):i("disconnected","Disconnected from "+e),n.connected=t}a.handleEvent("connected",({endpoint:e,conn:t})=>{y(e,!0)}),a.handleEvent("disconnected",({endpoint:e})=>y(e,!1)),a.handleEvent("sent",({message:e})=>{i("sent",e)}),a.handleEvent("received",({type:e,message:t})=>{i("received",e+": "+t)}),a.handleEvent("error",({message:e})=>{i("error",e)})}export{k as init};
