defmodule Kino.WebSocket.Client do
  require Logger
  use WebSockex

  def send_frame(ws_pid, frame) do
    WebSockex.send_frame(ws_pid, frame)
  end

  def close(ws_pid) do
    WebSockex.cast(ws_pid, :close)
  end

  def start(endpoint, parent_pid, opts) do
    Logger.info(
      "Starting WebSocket client to #{inspect(endpoint)} with pid #{inspect(parent_pid)}, opts=#{inspect(opts)}"
    )

    WebSockex.start(
      endpoint,
      __MODULE__,
      %{parent_pid: parent_pid, endpoint: endpoint, connected: false},
      opts
    )
  end

  def start_link(endpoint, parent_pid, opts) do
    Logger.info(
      "Starting WebSocket client to #{inspect(endpoint)} with pid #{inspect(parent_pid)}, opts=#{inspect(opts)}"
    )

    WebSockex.start_link(
      endpoint,
      __MODULE__,
      %{parent_pid: parent_pid, endpoint: endpoint, connected: false},
      opts
    )
  end

  @impl WebSockex
  def handle_connect(conn, state) do
    send(state.parent_pid, {:connected, state.endpoint, conn})

    {:ok, %{state | connected: true}}
  end

  @impl WebSockex
  def handle_frame({type, message}, state) do
    send(state.parent_pid, {:frame, type, message})

    {:ok, state}
  end

  @impl WebSockex
  def handle_disconnect(_connection_status_map, state) do
    send(state.parent_pid, {:disconnected, state.endpoint})

    {:ok, %{state | connected: false}}
  end
end
