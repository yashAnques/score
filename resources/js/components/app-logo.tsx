import AppLogoIcon from './app-logo-icon';

function redirectToCertificate() {
    window.location.href = 'https://bschoolbuzz.in/assets/certificate.jpg';
}

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md text-sidebar-primary-foreground">
                <AppLogoIcon className="w-full" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-xl text-white">
                <span className="text-xl font-bold leading-tight text-blue-950 dark:text-white">
                    BSchool<span className="text-yellow-500">Buzz</span>
                </span>
                <div className="flex items-center gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-black dark:text-white">
                        Recognised by
                    </span>
                    <button
                        type="button"
                        className="text-[10px] font-bold text-yellow-500 underline-offset-2 hover:underline cursor-pointer"
                        onClick={redirectToCertificate}
                    >
                        #StartupIndia
                    </button>
                </div>
            </div>
        </>
    );
}
