defmodule Kino.WebSocket.SmartCell do
  require Logger

  use Kino.JS, assets_path: "lib/assets/html"
  use Kino.JS.Live
  use Kino.SmartCell, name: "WebSocket Client"

  @default_extra_headers []
  @default_settings %{"show_timestamps" => true}
  @default_endpoint "wss://ws.postman-echo.com/raw"

  @impl true
  def init(attrs, ctx) do
    ctx =
      ctx
      |> assign(endpoint: attrs["endpoint"] || @default_endpoint)
      |> assign(extra_headers: attrs["extra_headers"] || @default_extra_headers)
      |> assign(settings: attrs["settings"] || @default_settings)

    {:ok, ctx}
  end

  @impl Kino.JS.Live
  def handle_connect(ctx) do
    {:ok,
     %{
       endpoint: ctx.assigns.endpoint,
       extra_headers: ctx.assigns.extra_headers,
       settings: ctx.assigns.settings
     }, ctx}
  end

  @impl Kino.JS.Live
  def handle_event("update_headers", %{"extra_headers" => extra_headers}, ctx) do
    broadcast_event(ctx, "update_headers", %{extra_headers: extra_headers})

    ctx
    |> assign(extra_headers: extra_headers)
    |> noreply()
  end

  def handle_event("update_settings", %{"settings" => settings}, ctx) do
    broadcast_event(ctx, "update_settings", %{settings: settings})
    ctx |> assign(settings: settings) |> noreply()
  end

  def handle_event("connect", %{"endpoint" => endpoint}, ctx) do
    opts = [
      extra_headers: header_list_to_tuple(ctx.assigns.extra_headers)
    ]

    Kino.WebSocket.Client.start(endpoint, self(), opts)
    |> case do
      {:ok, websocket_pid} ->
        ctx
        |> assign(endpoint: endpoint)
        |> assign(websocket_pid: websocket_pid)
        |> noreply()

      {:error, reason} ->
        broadcast_event(ctx, "error", %{message: "Failed to connect: #{inspect(reason)}"})

        ctx
        |> noreply()
    end
  end

  def handle_event("disconnect", _, ctx) do
    if ctx.assigns.websocket_pid != nil do
      :ok = Kino.WebSocket.Client.close(ctx.assigns.websocket_pid)

      broadcast_event(ctx, "disconnected", %{"endpoint" => ctx.assigns.endpoint})

      ctx
      |> assign(connected: false, websocket_pid: nil, endpoint: nil)
      |> noreply()
    else
      ctx
      |> noreply()
    end
  end

  def handle_event("send", %{"message" => message}, ctx) do
    if ctx.assigns.websocket_pid != nil do
      Kino.WebSocket.Client.send_frame(ctx.assigns.websocket_pid, {:text, message})
      broadcast_event(ctx, "sent", %{message: message})
    end

    ctx
    |> noreply()
  end

  def handle_event(event, payload, ctx) do
    Logger.error(
      "Unhandled event: event=#{inspect(event)} payload=#{inspect(payload)} ctx=#{inspect(ctx)}"
    )

    ctx
    |> noreply()
  end

  @impl Kino.JS.Live
  def handle_info({:connected, endpoint, conn}, ctx) do
    conn = %{
      host: conn.host,
      port: conn.port,
      path: conn.path,
      resp_headers: conn.resp_headers |> Map.new()
    }

    broadcast_event(ctx, "connected", %{"endpoint" => endpoint, "conn" => conn})

    ctx
    |> assign(connected: true)
    |> noreply()
  end

  def handle_info({:disconnected, endpoint}, ctx) do
    broadcast_event(ctx, "disconnected", %{"endpoint" => endpoint})

    ctx
    |> assign(connected: false, websocket_pid: nil)
    |> noreply()
  end

  def handle_info({:websocket_message, message}, ctx) do
    broadcast_event(ctx, "received", %{message: message})

    ctx
    |> noreply()
  end

  def handle_info({:frame, type, message}, ctx) do
    broadcast_event(ctx, "received", %{type: type, message: message})

    ctx
    |> noreply()
  end

  @impl Kino.SmartCell
  def to_attrs(ctx) do
    %{
      "endpoint" => ctx.assigns.endpoint,
      "extra_headers" => ctx.assigns.extra_headers,
      "settings" => ctx.assigns.settings
    }
  end

  @impl Kino.SmartCell
  def to_source(attrs) do
    quote do
      defmodule unquote(Module.concat(__MODULE__, Client)) do
        use WebSockex

        def start_link(endpoint, parent) do
          WebSockex.start_link(endpoint, __MODULE__, parent,
            extra_headers: unquote(header_list_to_tuple(attrs["extra_headers"]))
          )
        end

        def handle_frame({:text, message}, parent) do
          send(parent, {:websocket_message, message})
          {:ok, parent}
        end

        def handle_disconnect(%{reason: {:local, _reason}}, state) do
          {:ok, state}
        end

        def handle_cast(:close, state) do
          {:close, state}
        end
      end

      unquote(Module.concat(__MODULE__, Client)).start_link(unquote(attrs["endpoint"]))
    end
    |> Kino.SmartCell.quoted_to_string()
  end

  defp header_list_to_tuple(extra_headers) do
    extra_headers
    |> Enum.map(fn [k, v] -> {k, v} end)
    |> Enum.filter(fn
      {"", ""} -> false
      _ -> true
    end)
  end

  defp noreply(ctx), do: {:noreply, ctx}
end
