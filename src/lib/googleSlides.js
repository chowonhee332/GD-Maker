/**
 * Google Slides API / Drive API 연동 스켈레톤
 * 
 * TODO: 
 * 1. Google Cloud Console에서 프로젝트 생성 및 OAuth 2.0 클라이언트 ID 발급
 * 2. @react-oauth/google 또는 gapi-script 연동을 통해 accessToken 획득
 * 3. 발급받은 accessToken으로 이 함수들을 호출 
 */

const GOOGLE_API_BASE = 'https://slides.googleapis.com/v1/presentations';

/**
 * 새로운 빈 프레젠테이션을 생성합니다.
 * @param {string} title 프레젠테이션 제목
 * @param {string} accessToken 구글 OAuth 토큰
 * @returns {Promise<string>} 생성된 presentationId
 */
export const createPresentation = async (title, accessToken) => {
    if (!accessToken) {
        throw new Error("Google OAuth 토큰이 필요합니다.");
    }

    const response = await fetch(GOOGLE_API_BASE, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    return data.presentationId; // e.g., '1E-xxxxxx'
};

/**
 * AI가 생성한 슬라이드 데이터를 바탕으로 Google Slides API BatchUpdate 요청을 생성하고 보냅니다.
 * @param {string} presentationId 대상 프리젠테이션 ID
 * @param {Array} generatedSlides AI가 생성한 JSON 슬라이드 배열
 * @param {string} accessToken 구글 OAuth 토큰
 */
export const buildSlidesTarget = async (presentationId, generatedSlides, accessToken) => {
    if (!accessToken) throw new Error("Google OAuth 토큰이 필요합니다.");

    // 1. 필요한 슬라이드 페이지(Page) 생성 파서
    const requests = [];

    generatedSlides.forEach((slide, index) => {
        const slideObjectId = `slide_${index}`;

        // a. Create Slide Request
        requests.push({
            createSlide: {
                objectId: slideObjectId,
                insertionIndex: index,
                slideLayoutReference: { predefinedLayout: 'BLANK' } // Custom Drawing
            }
        });

        // b. Insert Background Color Shape
        const bgObjectId = `bg_${index}`;
        requests.push({
            createShape: {
                objectId: bgObjectId,
                elementProperties: {
                    pageObjectId: slideObjectId,
                    size: { height: { magnitude: 3000000, unit: 'EMU' }, width: { magnitude: 3000000, unit: 'EMU' } },
                    transform: { scaleX: 3.0, scaleY: 1.8, translateX: 0, translateY: 0, unit: 'EMU' }
                },
                shapeType: 'RECTANGLE'
            }
        });

        // TODO: 텍스트 박스, 이미지(visualAssets) 추가를 위한 BatchUpdate 파서 로직 고도화
    });

    // 2. Batch Update 실행
    const response = await fetch(`${GOOGLE_API_BASE}/${presentationId}:batchUpdate`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    return data;
};
