export const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-t border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            © {new Date().getFullYear()} WeatherLux. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};