import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import toast from 'react-hot-toast';
import { hairstyleSystemPrompt } from '../constants/geminiSystemPrompt';
import './HairStyleAI.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (!result || typeof result !== 'string') {
        reject(new Error('Unable to read image file'));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });

const stripJsonFence = (text) =>
  text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

const parseJsonSafely = (rawText) => {
  const cleaned = stripJsonFence(rawText || '');
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  const candidates = [cleaned];
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(cleaned.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // try next candidate
    }
  }

  throw new Error('Invalid JSON returned by the model');
};

const extractTextFromOpenRouterResponse = (data) => {
  const content = data?.choices?.[0]?.message?.content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('')
      .trim();
  }
  return (typeof content === 'string' ? content : '').trim();
};

const HairStyleAI = () => {
  const [frontPhoto, setFrontPhoto] = useState(null);
  const [sidePhoto, setSidePhoto] = useState(null);
  const [frontPreview, setFrontPreview] = useState('');
  const [sidePreview, setSidePreview] = useState('');
  const [hairTexture, setHairTexture] = useState('');
  const [lifestyle, setLifestyle] = useState('');
  const [preferences, setPreferences] = useState('');
  const [avoidStyle, setAvoidStyle] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (event, setFile, setPreview) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Please upload an image smaller than 8MB.');
      return;
    }

    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const analyzeHairstyle = async () => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    const model = import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';

    if (!apiKey) {
      toast.error('Missing VITE_OPENROUTER_API_KEY in environment variables.');
      return;
    }

    if (!frontPhoto || !sidePhoto) {
      toast.error('Please upload both front and side profile photos.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const [frontDataUrl, sideDataUrl] = await Promise.all([
        toDataUrl(frontPhoto),
        toDataUrl(sidePhoto),
      ]);

      const userContext = {
        hairTexture,
        lifestyle,
        preferences,
        avoidStyle,
      };

      const requestPayload = {
        model,
        messages: [
          {
            role: 'system',
            content: hairstyleSystemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `User preferences JSON:\n${JSON.stringify(userContext)}`,
              },
              {
                type: 'text',
                text: 'Image 1: Front profile',
              },
              {
                type: 'image_url',
                image_url: {
                  url: frontDataUrl,
                },
              },
              {
                type: 'text',
                text: 'Image 2: Side profile',
              },
              {
                type: 'image_url',
                image_url: {
                  url: sideDataUrl,
                },
              },
            ],
          },
        ],
        temperature: 0.45,
        top_p: 0.95,
        max_tokens: 2200,
        response_format: {
          type: 'json_object',
        },
      };

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      };

      if (typeof window !== 'undefined') {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'Book My Salon';
      }

      const response = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers,
          body: JSON.stringify(requestPayload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || 'OpenRouter request failed');
      }

      const rawText = extractTextFromOpenRouterResponse(data);

      if (!rawText) {
        throw new Error('No response returned from Gemini');
      }

      let parsed;

      try {
        parsed = parseJsonSafely(rawText);
      } catch {
        // If the model returns malformed JSON, ask it to repair the JSON.
        const repairResponse = await fetch(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: 'system',
                  content: 'You fix malformed JSON. Return ONLY valid JSON.',
                },
                {
                  role: 'user',
                  content: `Fix this malformed JSON. Return ONLY valid JSON with the same schema and values as much as possible:\n\n${rawText}`,
                },
              ],
              temperature: 0,
              max_tokens: 2400,
              response_format: {
                type: 'json_object',
              },
            }),
          }
        );

        const repairData = await repairResponse.json();
        if (!repairResponse.ok) {
          throw new Error(repairData?.error?.message || 'OpenRouter JSON repair failed');
        }

        const repairedText = extractTextFromOpenRouterResponse(repairData);
        parsed = parseJsonSafely(repairedText);
      }

      if (!parsed?.recommendedHairstyles?.length) {
        throw new Error('Model response format is invalid');
      }

      setResult(parsed);
      toast.success('Hairstyle recommendations generated.');
    } catch (error) {
      toast.error(error.message || 'Failed to analyze hairstyle.');
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    const styles = result?.recommendedHairstyles || [];

    return {
      labels: styles.map((style) => style.name),
      datasets: [
        {
          label: 'Suitability Score',
          data: styles.map((style) => style.suitabilityScore),
          backgroundColor: ['#00A3FF', '#00C2A8', '#FF8C42', '#7B8DFF'],
          borderColor: ['#0079C2', '#00907C', '#D66A20', '#5C6BDB'],
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    };
  }, [result]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Style Match Score',
        color: '#0f172a',
        font: {
          family: 'Space Grotesk, sans-serif',
          size: 15,
          weight: '700',
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: '#334155',
        },
        grid: {
          color: 'rgba(15, 23, 42, 0.08)',
        },
      },
      x: {
        ticks: {
          color: '#334155',
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="ha-page">
      <div className="ha-bg-orb ha-bg-orb-a" />
      <div className="ha-bg-orb ha-bg-orb-b" />

      <div className="ha-shell">
        <header className="ha-header ha-fade-up ha-delay-1">
          <div>
            <span className="ha-pill">AI powered preview</span>
            <h1 className="ha-title">AI Hairstyle Advisor</h1>
            <p className="ha-subtitle">
              Two photos in. Practical haircut plan out: style matches, celebrity references, barber script, and
              maintenance map.
            </p>
            <div className="ha-step-list">
              <span>1. Upload front + side</span>
              <span>2. Add your vibe</span>
              <span>3. Get style matches</span>
            </div>
          </div>
          <Link to="/" className="ha-secondary-btn">
            Back To Home
          </Link>
        </header>

        <section className="ha-grid">
          <div className="ha-card ha-fade-up ha-delay-2">
            <h2 className="ha-card-title">Input</h2>
            <p className="ha-card-note">Upload clear face photos. Front and side are required.</p>

            <div className="ha-upload-grid">
              <label className="ha-upload-box">
                <span className="ha-upload-title">Front Profile</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleFileChange(event, setFrontPhoto, setFrontPreview)}
                  className="ha-file"
                />
                {frontPreview ? (
                  <div className="ha-preview-container">
                    <img src={frontPreview} alt="Front preview" className="ha-preview" />
                    <button
                      className="ha-remove-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        setFrontPhoto(null);
                        setFrontPreview('');
                      }}
                      title="Remove image"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <div className="ha-upload-placeholder">Upload JPG/PNG</div>
                )}
              </label>

              <label className="ha-upload-box">
                <span className="ha-upload-title">Side Profile</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleFileChange(event, setSidePhoto, setSidePreview)}
                  className="ha-file"
                />
                {sidePreview ? (
                  <div className="ha-preview-container">
                    <img src={sidePreview} alt="Side preview" className="ha-preview" />
                    <button
                      className="ha-remove-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        setSidePhoto(null);
                        setSidePreview('');
                      }}
                      title="Remove image"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <div className="ha-upload-placeholder">Upload JPG/PNG</div>
                )}
              </label>
            </div>

            <div className="ha-fields">
              <input
                value={hairTexture}
                onChange={(event) => setHairTexture(event.target.value)}
                placeholder="Hair texture (straight/wavy/curly/coily)"
                className="ha-input"
              />
              <input
                value={lifestyle}
                onChange={(event) => setLifestyle(event.target.value)}
                placeholder="Lifestyle (corporate, student, sporty, low-maintenance)"
                className="ha-input"
              />
              <input
                value={preferences}
                onChange={(event) => setPreferences(event.target.value)}
                placeholder="Preferred vibe (clean fade, textured crop, longer flow)"
                className="ha-input"
              />
              <input
                value={avoidStyle}
                onChange={(event) => setAvoidStyle(event.target.value)}
                placeholder="Styles to avoid"
                className="ha-input"
              />
            </div>

            <button type="button" onClick={analyzeHairstyle} disabled={loading} className="ha-primary-btn">
              {loading ? (
                <span className="ha-btn-content">
                  <span className="ha-spinner" aria-hidden="true" />
                  Analyzing...
                </span>
              ) : (
                'Generate Recommendations'
              )}
            </button>
            {loading && <div className="ha-progress" aria-hidden="true" />}
            <p className="ha-env-note">
              Tip: Use clear lighting and remove glasses if possible
            </p>
          </div>

          <div className="ha-card ha-fade-up ha-delay-3">
            {!result ? (
              <div className="ha-empty-state" role="status" aria-live="polite">
                <h3>Ready For Analysis</h3>
                <p>Once processed, this panel shows summary insights and a style match chart.</p>
                <div className="ha-empty-pulse" />
              </div>
            ) : (
              <>
                <div className="ha-summary-head">
                  <h2 className="ha-card-title">AI Summary</h2>
                  <span className="ha-score-chip">Confidence {result.confidence}%</span>
                </div>
                <p cla-summe="ha-summary-text">{result.analysisSummary}</p>
                <div className="ha-chart-wrap">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </>
            )}
          </div>
        </section>

        {result && (
          <section className="ha-card ha-results-card">
            <div className="ha-summary-head">
              <h2 className="ha-card-title">Recommended Hairstyles</h2>
              <span className="ha-pill">Top 4 Matches</span>
            </div>

            <div className="ha-result-grid">
              {result.recommendedHairstyles.map((style, index) => (
                <article key={`${style.name}-${index}`} className="ha-style-card">
                  <div className="ha-style-head">
                    <h3>{style.name}</h3>
                    <span>{style.suitabilityScore}/100</span>
                  </div>

                  <p className="ha-style-why">{style.whyItWorks}</p>

                  <div className="ha-style-section">
                    <h4>Celebrity Examples</h4>
                    <p>{(style.celebrityExamples || []).join(', ')}</p>
                  </div>

                  <div className="ha-style-section">
                    <h4>What To Tell Your Barber</h4>
                    <ul className="ha-list">
                      {(style.barberInstructions || []).map((item, itemIndex) => (
                        <li key={itemIndex}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="ha-style-section">
                    <h4>Maintenance</h4>
                    <ul className="ha-list">
                      {(style.maintenanceTips || []).map((item, itemIndex) => (
                        <li key={itemIndex}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="ha-style-section">
                    <h4>Suggested Products</h4>
                    <p>{(style.products || []).join(', ')}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="ha-care-grid">
              <div className="ha-care-box">
                <h3>Daily Care</h3>
                <ul className="ha-list">
                  {(result.generalCarePlan?.daily || []).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="ha-care-box">
                <h3>Weekly Care</h3>
                <ul className="ha-list">
                  {(result.generalCarePlan?.weekly || []).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="ha-care-box">
                <h3>Monthly Care</h3>
                <ul className="ha-list">
                  {(result.generalCarePlan?.monthly || []).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="ha-disclaimer">{result.disclaimer}</p>
          </section>
        )}
      </div>
    </div>
  );
};

export default HairStyleAI;