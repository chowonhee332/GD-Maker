import React from 'react';
import {
    Deck,
    Slide,
    Box,
    FlexBox,
    FullScreen,
    Image,
} from 'spectacle';
import { Loader2 } from 'lucide-react';

const SpectacleSlides = ({ slides, ratio = '16:9', projectName = "GD-MAKER", slideImages = {} }) => {
    if (!slides || slides.length === 0) return null;

    return (
        <Deck
            theme={{
                colors: { primary: '#0a0a0b', secondary: '#3b82f6', tertiary: '#ffffff', quaternary: '#888888' },
                fonts: { header: '"Pretendard Variable", sans-serif', text: '"Pretendard Variable", sans-serif' },
            }}
            template={({ slideNumber, numberOfSlides }) => (
                <Box position="absolute" inset={0} pointerEvents="none" zIndex={100}>
                    <FlexBox justifyContent="flex-end" padding="30px 40px" width={1}>
                        <Box pointerEvents="auto" opacity={0.3} style={{ transition: 'opacity 0.3s' }} className="hover:opacity-100">
                            <FullScreen color="#888888" />
                        </Box>
                    </FlexBox>
                </Box>
            )}
        >
            {slides.map((slide, index) => {
                const bgImage = slideImages[slide.type];

                return (
                    <Slide
                        key={index}
                        backgroundColor="#0a0a0b"
                        style={{ padding: 0, overflow: 'hidden' }}
                    >
                        {bgImage ? (
                            <Box width="100%" height="100%" position="relative">
                                <Image
                                    src={bgImage}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            </Box>
                        ) : (
                            <Box width="100%" height="100%" display="flex" flexDirection="column" justifyContent="center" alignItems="center" backgroundColor="#1A1A1A">
                                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                                <div style={{ color: '#888', fontSize: '18px', fontFamily: '"Pretendard Variable"' }}>
                                    AI가 슬라이드 이미지를 렌더링 중입니다...
                                </div>
                            </Box>
                        )}
                    </Slide>
                );
            })}
        </Deck>
    );
};

export default SpectacleSlides;
