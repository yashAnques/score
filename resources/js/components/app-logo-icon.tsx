import { ImgHTMLAttributes } from 'react';

type AppLogoIconProps = ImgHTMLAttributes<HTMLImageElement>;

export default function AppLogoIcon({ className, ...rest }: AppLogoIconProps) {
    return <img src="/logo.jpeg" alt="BSchoolBuzz logo" className={className} {...rest} />;
}
