async function test() {
  console.log('Testing connection to jsDelivr CDN...');
  try {
    const res = await fetch('https://cdn.jsdelivr.net/npm/@splinetool/viewer@1.0.28/build/spline-viewer.js');
    console.log('Status:', res.status);
    console.log('Content-Type:', res.headers.get('content-type'));
  } catch (err) {
    console.error('Error fetching jsDelivr CDN:', err);
  }
}

test();
