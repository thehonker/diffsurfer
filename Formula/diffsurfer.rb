class Diffsurfer < Formula
  desc "A GUI for viewing commit history timelines"
  homepage "https://github.com/thehonker/diffsurfer"
  url "https://github.com/thehonker/diffsurfer/releases/download/v#{version}/Diffsurfer-#{version}-arm64.dmg"
  sha256 "0c4365466eb68770bac0fadb84a1cb3fcc4cb44fc1df959948798764829919d2"
  version "1.1.1"

  depends_on macos: ">= :catalina"

  app "Diffsurfer.app"

  def caveats
    <<~EOS
      To install the app, drag Diffsurfer.app from the DMG to your Applications folder.
    EOS
  end

  test do
    # Simple test to verify the app was installed
    assert File.exist?("#{appdir}/Diffsurfer.app/Contents/MacOS/Diffsurfer")
  end
end