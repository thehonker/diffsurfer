cask "diffsurfer" do
  version "1.1.10"
  sha256 "68941647b040477cf9b57eec635f1d1612d56e5f1c5ff3d8d542642d71811e5b"

  url "https://github.com/thehonker/diffsurfer/releases/download/v#{version}/Diffsurfer-#{version}-arm64.dmg"
  name "Diffsurfer"
  desc "A GUI for viewing commit history timelines"
  homepage "https://github.com/thehonker/diffsurfer"

  app "Diffsurfer.app"
end
