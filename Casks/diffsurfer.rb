cask "diffsurfer" do
  version "1.1.15"
  sha256 "884ebf5ba24306486962ffdc5f73d671e04814dcb9fe43dd218aa39ff19e2bd1"

  url "https://github.com/thehonker/diffsurfer/releases/download/v#{version}/Diffsurfer-#{version}-arm64.dmg"
  name "Diffsurfer"
  desc "A GUI for viewing commit history timelines"
  homepage "https://github.com/thehonker/diffsurfer"

  app "Diffsurfer.app"
end
