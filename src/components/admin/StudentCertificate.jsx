import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        backgroundColor: '#ba9779',
        padding: 0
    },
    pageWrapper: {
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
    },
    backgroundCircle: {
        position: 'absolute',
        backgroundColor: '#4a301d',
        borderRadius: 200,
        height: 380,
        width: 380
    },
    patternImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0.1
    },
    mainContainer: {
        position: 'absolute',
        top: 25,
        left: 25,
        right: 25,
        bottom: 25,
        border: '1.5pt solid #4a301d',
        borderRadius: 8,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    illustration: {
        position: 'absolute',
        width: 100,
        height: 100,
        opacity: 0.15
    },
    brandTitle: {
        fontSize: 16,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 2,
        color: '#4a301d'
    },
    brandSubtitle: {
        fontSize: 9,
        fontStyle: 'italic',
        marginTop: 1,
        color: '#4a301d'
    },
    mainTitle: {
        fontSize: 52,
        fontWeight: 700,
        letterSpacing: 6,
        color: '#000',
        textAlign: 'center'
    },
    studentName: {
        fontSize: 45,
        fontWeight: 700,
        textTransform: 'uppercase',
        textAlign: 'center',
        color: '#000'
    },
    signatureBlock: {
        alignItems: 'center',
        width: 200
    },
    signatureName: {
        fontSize: 15,
        fontWeight: 700,
        textTransform: 'uppercase',
        color: '#000'
    }
});

export function StudentCertificate({ student }) {
    const displayName = student?.fullName || student?.name || 'Gatesi Denyse';
    const trainerName = "EBENEZER Ishimwe";
    const ceoName = "Sandrine GASARASI";

    const beansPattern = '/image/beans_pattern.png';
    const plantImg = '/image/plant_illustration.png';
    const mokaImg = '/image/moka_illustration.png';

    return (
        <Document title={`Certificate - ${displayName}`}>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.pageWrapper}>
                    {/* Background Layer (Absolute) */}
                    <View style={[styles.backgroundCircle, { top: -140, right: -140 }]} />
                    <View style={[styles.backgroundCircle, { bottom: -140, left: -140 }]} />

                    {/* Content Area (Absolute covering inner part) */}
                    <View style={styles.mainContainer}>
                        {/* Clutter illustrations (Disabled for testing) */}
                        {/* <Image src={mokaImg} style={[styles.illustration, { top: 0, left: 0 }]} /> */}
                        {/* <Image src={plantImg} style={[styles.illustration, { bottom: 0, right: 0 }]} /> */}

                        {/* Top Section */}
                        <View style={{ alignItems: 'center' }}>
                            {/* <Image src="/logo.jpg" style={{ width: 85, height: 48, marginBottom: 5 }} /> */}
                            <Text style={styles.brandTitle}>Usafi Coffee</Text>
                            <Text style={styles.brandSubtitle}>you deserve the best</Text>
                        </View>

                        {/* Middle Section */}
                        <View style={{ alignItems: 'center' }}>
                            <Text style={styles.mainTitle}>CERTIFICATE</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 0 }}>
                                <View style={{ width: 50, height: 1.2, backgroundColor: '#000' }} />
                                <Text style={{ fontSize: 13, fontWeight: 700, marginHorizontal: 10 }}>of Appreciation</Text>
                                <View style={{ width: 50, height: 1.2, backgroundColor: '#000' }} />
                            </View>

                            <View style={{ alignItems: 'center', marginTop: 15 }}>
                                <Text style={{ fontSize: 17, fontStyle: 'italic', marginBottom: 5 }}>This is to certify that</Text>
                                <Text style={styles.studentName}>{displayName}</Text>
                                <View style={{ width: 300, height: 1.5, backgroundColor: '#000', marginTop: 4 }} />
                            </View>
                        </View>

                        {/* Bottom Section */}
                        <View style={{ alignItems: 'center', width: '80%' }}>
                            <Text style={{ fontSize: 11, textAlign: 'center', lineHeight: 1.6, fontWeight: 700 }}>
                                Has demonstrated the knowledge and skills required for professional barista services,{"\n"}
                                Including coffee preparation, espresso techniques, latte art, and customer service.{"\n"}
                                Which held from September 01st to December 01st 2025, Provided by Usafi barista training center.
                            </Text>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '120%', marginTop: 25 }}>
                                <View style={styles.signatureBlock}>
                                    <View style={{ width: 160, height: 1.2, backgroundColor: '#000', marginBottom: 5 }} />
                                    <Text style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Trainer</Text>
                                    <Text style={styles.signatureName}>{trainerName}</Text>
                                </View>
                                <View style={styles.signatureBlock}>
                                    <View style={{ width: 160, height: 1.2, backgroundColor: '#000', marginBottom: 5 }} />
                                    <Text style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>CEO</Text>
                                    <Text style={styles.signatureName}>{ceoName}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
}
