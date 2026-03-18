cask "diffsurfer" do
  version "1.3.5"
  sha256 :no_check

  url "https://github.com/thehonker/diffsurfer/releases/latest/download/Diffsurfer-#{version}-mac.zip"
  name "Diffsurfer"
  desc "GUI commit history timeline viewer for Git repositories"
  homepage "https://github.com/thehonker/diffsurfer"

  app "Diffsurfer.app"

  zap trash: [
    "~/Library/Application Support/com.thehonker.diffsurfer",
    "~/Library/Caches/com.thehonker.diffsurfer",
    "~/Library/Logs/Diffsurfer",
    "~/Library/Preferences/com.thehonker.diffsurfer.plist",
  ]
end
