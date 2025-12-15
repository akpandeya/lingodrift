import { Moon, Sun, Laptop } from "lucide-react"
import { useTheme } from "../../context/ThemeContext"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { clsx } from "clsx"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Toggle Theme"
            >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-gray-700 dark:text-gray-400" />
                <Moon className="absolute top-2 h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-gray-700 dark:text-gray-400" />
                <span className="sr-only">Toggle theme</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -5 }}
                            className="absolute right-0 bottom-full mb-2 w-36 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-50 p-1"
                        >
                            {[
                                { name: "light", icon: Sun, label: "Light" },
                                { name: "dark", icon: Moon, label: "Dark" },
                                { name: "system", icon: Laptop, label: "System" },
                            ].map(({ name, icon: Icon, label }) => (
                                <button
                                    key={name}
                                    onClick={() => {
                                        setTheme(name as "light" | "dark" | "system")
                                        setIsOpen(false)
                                    }}
                                    className={clsx(
                                        "flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors",
                                        theme === name
                                            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    )}
                                >
                                    <Icon className="mr-2 h-4 w-4" />
                                    {label}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
