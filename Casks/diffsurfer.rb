cask "diffsurfer" do
  version "1.1.11"
  sha256 "e634befd2c4d8dc53541124ebc42666fd00fa1ec6ed71aeca7d018400ddc4320"

  url "https://github.com/thehonker/diffsurfer/releases/download/v#{version}/Diffsurfer-#{version}-arm64.dmg"
  name "Diffsurfer"
  desc "A GUI for viewing commit history timelines"
  homepage "https://github.com/thehonker/diffsurfer"

  app "Diffsurfer.app"
end
