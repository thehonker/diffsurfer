cask "diffsurfer" do
  version "1.1.16"
  sha256 "784fbd6dccd96b27d19c608cbb33d2a492cc3f9c2dcd472ae615ae96bf8743fe"

  url "https://github.com/thehonker/diffsurfer/releases/download/v#{version}/Diffsurfer-#{version}-arm64.dmg"
  name "Diffsurfer"
  desc "A GUI for viewing commit history timelines"
  homepage "https://github.com/thehonker/diffsurfer"

  app "Diffsurfer.app"
end
