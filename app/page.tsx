import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { HardDrive, MessageCircle, FolderOpen, Upload, Bot, FileText, Search } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-50 to-blue-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">GSH Smart File System</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              It's basically a weaker Dropbox (in a good way) with ChatGPT functionality. Simple file storage and
              organization with AI chat to help you find and understand your files.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/projects" className="flex items-center space-x-2">
                  <FolderOpen className="w-5 h-5" />
                  <span>Manage Projects and Deals</span>
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/brokers" className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Manage Broker Relations</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What It Does Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What This Tool Does</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Three main things: store files, organize them, and chat about them with AI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Upload & Store Files</h3>
                <p className="text-gray-600">
                  Drag and drop files like you would in Dropbox. Create folders, organize stuff. Nothing fancy, just
                  basic file storage that works.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Ask AI About Your Files</h3>
                <p className="text-gray-600">
                  This is the cool part. Chat with AI about your files - ask questions, get summaries, find information.
                  It's like having ChatGPT for your documents.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Find Things Easier</h3>
                <p className="text-gray-600">
                  Instead of digging through folders, just ask the AI. "Where's that contract?" or "What did the meeting
                  notes say?" Much faster than manual searching.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Chat Feature */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">The AI Chat Feature</h2>
              <p className="text-lg text-gray-600 mb-6">
                This is what makes it "smart". Instead of manually searching through files, you can just ask questions
                in plain English and get answers.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageCircle className="w-3 h-3 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Ask Simple Questions</h4>
                    <p className="text-gray-600">"What's in my budget spreadsheet?" or "Summarize this report"</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Search className="w-3 h-3 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Find Files Fast</h4>
                    <p className="text-gray-600">
                      "Show me all PDFs from last month" or "Where's the Johnson contract?"
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="w-3 h-3 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Get Quick Summaries</h4>
                    <p className="text-gray-600">"Give me the key points from this 20-page document"</p>
                  </div>
                </div>
              </div>

              <Button size="lg" asChild>
                <Link href="/chat" className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Try the AI Chat</span>
                </Link>
              </Button>
            </div>

            {/* Login Prompt Section */}
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HardDrive className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Ready to Get Started?</h3>
              <p className="text-gray-600 mb-6">
                Login to access your files and start chatting with AI about your documents. It's that simple.
              </p>
              <div className="space-y-3">
                <Button size="lg" className="w-full" asChild>
                  <Link href="/file-system">
                    <FolderOpen className="w-5 h-5 mr-2" />
                    Access File System
                  </Link>
                </Button>
                <Button size="lg" className="w-full" asChild>
                  <Link href="/chat">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Start AI Chat
                  </Link>
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-4">Use the login button in the top right to get started</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Use This */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Use This Instead of Regular File Storage?</h2>
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-600">✓ What's Good About It</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Simple file storage without the complexity of full Dropbox</li>
                <li>• AI chat makes finding information much faster</li>
                <li>• No need to remember where you put files</li>
                <li>• Get quick summaries of long documents</li>
                <li>• Works for internal team file sharing</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 text-orange-600">⚠ What It's Not</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Not as feature-rich as Dropbox or Google Drive</li>
                <li>• No advanced collaboration tools</li>
                <li>• AI responses depend on file content quality</li>
                <li>• Built for internal use, not external sharing</li>
                <li>• Simpler = fewer bells and whistles</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Get Started */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Try It?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Start with uploading some files, then chat with the AI about them
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/file-system" className="flex items-center space-x-2">
                <FolderOpen className="w-5 h-5" />
                <span>Upload Files</span>
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600"
              asChild
            >
              <Link href="/chat" className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Try AI Chat</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">GSH Smart File System</span>
            </div>
            <div className="text-gray-400">Internal Tool • GSH Team</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
