// 현재 위치의 날씨를 Open-Meteo에서 가져온다 (API 키 필요 없음).

const SEOUL = { lat: 37.5665, lon: 126.978 };

function getPosition() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    // 위치 허용 창에 답을 안 하면 브라우저가 계속 기다리므로 10초 뒤엔 위치 없이 진행
    setTimeout(() => resolve(null), 10000);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => resolve(null), // 권한 거부나 실패
      { timeout: 8000, maximumAge: 30 * 60 * 1000 }
    );
  });
}

// 결과: { weather, note }. weather가 null이면 날씨 없이 고른다.
export async function loadWeather() {
  const pos = await getPosition();
  const { lat, lon } = pos || SEOUL;
  const note = pos ? null : '위치를 못 받아서 서울 날씨 기준이에요.';
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    '&current=temperature_2m,precipitation,weather_code&timezone=auto';
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { current } = await res.json();
    return {
      weather: {
        temperature: current.temperature_2m,
        precipitation: current.precipitation,
        weatherCode: current.weather_code,
      },
      note,
    };
  } catch {
    return { weather: null, note: '날씨를 못 가져와서 날씨 없이 골라요.' };
  }
}
