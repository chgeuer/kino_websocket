defmodule Kino.WebSocket.Application do
  @moduledoc """
  The application file for Kino.WebSocket.
  """
  use Application

  @impl Application
  def start(_type, _args) do
    Kino.SmartCell.register(Kino.WebSocket.SmartCell)

    {:ok, self()}
  end
end
