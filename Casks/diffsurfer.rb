cask "diffsurfer" do
  version "1.1.4"
  sha256 "0c4365466eb68770bac0fadb84a1cb3fcc4cb44fc1df959948798764829919d2"

  url "https://github.com/thehonker/diffsurfer/releases/download/v#{version}/Diffsurfer-#{version}-arm64.dmg"
  name "Diffsurfer"
  desc "A GUI for viewing commit history timelines"
  homepage "https://github.com/thehonker/diffsurfer"

  app "Diffsurfer.app"

  caveats do
    requires_rosetta
  end
end
