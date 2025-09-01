import { Github, Linkedin } from "lucide-react"

export const Footer = () => {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center space-x-6">
            <a
              href="https://github.com/harivignesh33"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center space-x-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-5 w-5 transition-transform group-hover:scale-110" />
              <span className="text-sm font-medium">GitHub</span>
            </a>
            <div className="h-4 w-px bg-border" />
            <a
              href="https://linkedin.com/in/hari-k"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center space-x-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Linkedin className="h-5 w-5 transition-transform group-hover:scale-110" />
              <span className="text-sm font-medium">LinkedIn</span>
            </a>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Built with ❤️ using Next.js and OpenWeatherMap API
          </p>
        </div>
      </div>
    </footer>
  )
}