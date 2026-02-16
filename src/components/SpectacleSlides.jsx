import React from 'react';
import {
    Deck,
    Slide,
    Heading,
    Text,
    Box,
    FlexBox,
    FullScreen,
    Progress,
} from 'spectacle';
import { Sparkles } from 'lucide-react';

const SpectacleSlides = ({ slides, ratio = '16:9' }) => {
    if (!slides || slides.length === 0) return null;

    const template = {
        colors: {
            primary: '#ebe5da',
            secondary: '#fc0',
            tertiary: '#fff',
            quaternary: '#000',
        },
        fonts: {
            header: '"Inter", sans-serif',
            text: '"Inter", sans-serif',
        },
    };

    const getRatio = () => {
        if (ratio === '4:3') return [1024, 768];
        if (ratio === '1:1') return [800, 800];
        return [1366, 768]; // 16:9
    };

    return (
        <Deck template={({ slideNumber, numberOfSlides }) => (
            <FlexBox
                justifyContent="space-between"
                position="absolute"
                bottom={0}
                width={1}
                padding="x-small"
            >
                <Box padding="0 1em">
                    <FullScreen color="black" />
                </Box>
                <Box padding="1em">
                    <Progress color="black" />
                </Box>
            </FlexBox>
        )} transitionEffect="fade">
            {slides.map((slide, index) => {
                const theme = slide.theme || { bg: '#ffffff', text: '#000000', accent: '#3b82f6' };
                const isCover = slide.type === 'cover';

                return (
                    <Slide
                        key={index}
                        backgroundColor={theme.bg}
                        textColor={theme.text}
                    >
                        <FlexBox height="100%" flexDirection="column" alignItems="start" justifyContent="center">
                            {/* Header Visual */}
                            <FlexBox alignItems="center" marginBottom="40px">
                                <Box
                                    width="50px"
                                    height="50px"
                                    backgroundColor={theme.accent + '20'}
                                    borderRadius="12px"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    marginRight="20px"
                                >
                                    <Sparkles style={{ color: theme.accent, fontSize: 24 }} />
                                </Box>
                                {!isCover && (
                                    <Text fontSize="14px" fontWeight="bold" color={theme.accent} margin="0">
                                        {slide.type === 'index' ? 'SECTION 01' : 'CHAPTER INSIGHTS'}
                                    </Text>
                                )}
                            </FlexBox>

                            {/* Title */}
                            <Heading
                                fontSize={isCover ? "72px" : "48px"}
                                color={theme.text}
                                textAlign="left"
                                fontWeight="900"
                                margin="0 0 40px 0"
                            >
                                {slide.title}
                            </Heading>

                            {/* Content */}
                            <Text
                                fontSize={isCover ? "24px" : "20px"}
                                color={theme.text}
                                lineHeight="1.6"
                                textAlign="left"
                                margin="0"
                                style={{ opacity: 0.8 }}
                            >
                                {slide.content}
                            </Text>

                            {/* Design Rationale (Small Bottom Left) */}
                            {slide.designRationale && (
                                <Box
                                    position="absolute"
                                    bottom="40px"
                                    left="40px"
                                    maxWidth="600px"
                                    padding="16px"
                                    borderRadius="16px"
                                    backgroundColor={theme.text + '05'}
                                    border={`1px solid ${theme.text}10`}
                                >
                                    <Text fontSize="12px" fontWeight="bold" margin="0 0 8px 0" color={theme.accent} style={{ letterSpacing: '2px' }}>
                                        AI DESIGN RATIONALE
                                    </Text>
                                    <Text fontSize="12px" italic margin="0" style={{ opacity: 0.6 }}>
                                        "{slide.designRationale}"
                                    </Text>
                                </Box>
                            )}
                        </FlexBox>
                    </Slide>
                );
            })}
        </Deck>
    );
};

export default SpectacleSlides;
