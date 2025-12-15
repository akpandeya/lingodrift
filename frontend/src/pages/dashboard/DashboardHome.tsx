export const DashboardHome = () => {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Willkommen zurück, Alex! 👋</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Ready to conquer your German B1 Exam today?</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Exams Passed', value: '4', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
                    { label: 'Study Streak', value: '12 Days', color: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400' },
                    { label: 'Next Goal', value: 'Goethe B1', color: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{stat.label}</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Placeholder for Recent Activity */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 h-64 flex items-center justify-center text-gray-400 dark:text-gray-500 transition-colors">
                Recent Exam Activity Chart (Recharts) goes here...
            </div>
        </div>
    );
};
