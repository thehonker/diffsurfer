cask "diffsurfer" do
  version "1.1.6"
  sha256 "8ae5b75e2df14c305d3f023c53d0dc36302b15b7e07dffd30f9ba3fd01264f71"

  url "https://github.com/thehonker/diffsurfer/releases/download/v#{version}/Diffsurfer-#{version}-arm64.dmg"
  name "Diffsurfer"
  desc "A GUI for viewing commit history timelines"
  homepage "https://github.com/thehonker/diffsurfer"

  app "Diffsurfer.app"
end
