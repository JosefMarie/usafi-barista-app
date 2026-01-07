import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

export const SEO = ({ title, description, type = 'website' }) => {
    const { i18n } = useTranslation();
    const currentLang = i18n.language;

    // Default values
    const siteTitle = "Usafi Barista Training Center";
    const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
    const metaDescription = description || "Rwanda's premier barista training center connecting skilled graduates with top employers. Master the art of coffee with expert guidance.";
    const startUrl = "https://www.usafi-barista.com";

    return (
        <Helmet>
            {/* Standard metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={metaDescription} />
            <html lang={currentLang} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:url" content={window.location.href} />
            <meta property="og:site_name" content={siteTitle} />
            {/* You would ideally add an og:image here once you have a designated social share image */}
            {/* <meta property="og:image" content={`${startUrl}/social-share.jpg`} /> */}

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={metaDescription} />

            {/* Canonical URL */}
            <link rel="canonical" href={window.location.href} />
        </Helmet>
    );
};
