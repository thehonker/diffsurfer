cask "diffsurfer" do
  version "1.1.8"
  sha256 "5e8019b106d5f5c5d75f91a14ce2092bddcdc923c6b2671c59468bad1cd1be94"

  url "https://github.com/thehonker/diffsurfer/releases/download/v#{version}/Diffsurfer-#{version}-arm64.dmg"
  name "Diffsurfer"
  desc "A GUI for viewing commit history timelines"
  homepage "https://github.com/thehonker/diffsurfer"

  app "Diffsurfer.app"
end
