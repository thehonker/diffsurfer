cask "diffsurfer" do
  version "1.1.10"
  sha256 "090e59322b676bf392ad2d4b453de13373528f2256cba64066b17e875b77240d"

  url "https://github.com/thehonker/diffsurfer/releases/download/v#{version}/Diffsurfer-#{version}-arm64.dmg"
  name "Diffsurfer"
  desc "A GUI for viewing commit history timelines"
  homepage "https://github.com/thehonker/diffsurfer"

  app "Diffsurfer.app"
end
