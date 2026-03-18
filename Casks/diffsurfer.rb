cask "diffsurfer" do
  version "1.1.6"
  sha256 "3f26363f28964bcf9ec48fec4059c048570b1bb20966750f9245e4a4f82f1d94"

  url "https://github.com/thehonker/diffsurfer/releases/download/v#{version}/Diffsurfer-#{version}-arm64.dmg"
  name "Diffsurfer"
  desc "A GUI for viewing commit history timelines"
  homepage "https://github.com/thehonker/diffsurfer"

  app "Diffsurfer.app"
end
