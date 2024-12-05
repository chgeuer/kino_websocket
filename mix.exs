defmodule Kino.WebSocket.MixProject do
  use Mix.Project

  def project do
    [
      app: :kino_websocket,
      version: "0.1.0",
      elixir: "~> 1.17",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  # Run "mix help compile.app" to learn about applications.
  def application do
    [
      extra_applications: [:logger],
      mod: {Kino.WebSocket.Application, []}
    ]
  end

  # Run "mix help deps" to learn about dependencies.
  defp deps do
    [
      {:kino, "~> 0.14.2"},
      {:websockex, "~> 0.4.3"}
    ]
  end
end
