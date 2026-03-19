cask "diffsurfer" do
  version "1.1.17"
  sha256 "debf6e432c56b8cef033fa26fce1303b32d2ae29bf01f036dc703cb84bc9e46e"

  url "https://github.com/thehonker/diffsurfer/releases/download/v#{version}/Diffsurfer-#{version}-arm64.dmg"
  name "Diffsurfer"
  desc "A GUI for viewing commit history timelines"
  homepage "https://github.com/thehonker/diffsurfer"

  app "Diffsurfer.app"
end
