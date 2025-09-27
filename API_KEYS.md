# API Keys Setup Guide

This document outlines all the API keys you need to obtain for the Positive News Aggregator platform.

## Required API Keys

### 1. NewsAPI

**Purpose**: Fetch news articles from 80,000+ sources worldwide

**Steps to obtain**:
1. Visit [https://newsapi.org/register](https://newsapi.org/register)
2. Sign up for a free account
3. Verify your email address
4. Copy your API key from the dashboard
5. Add to `.env` file:
   ```
   NEWSAPI_KEY=your_api_key_here
   ```

**Tier**: Free tier includes 1,000 requests/day

**Documentation**: [https://newsapi.org/docs](https://newsapi.org/docs)

---

### 2. The Guardian API

**Purpose**: Quality journalism and in-depth articles from The Guardian

**Steps to obtain**:
1. Visit [https://open-platform.theguardian.com/access/](https://open-platform.theguardian.com/access/)
2. Register for a developer key
3. Fill out the application form (usually approved instantly)
4. Copy your API key from the confirmation email
5. Add to `.env` file:
   ```
   GUARDIAN_API_KEY=your_api_key_here
   ```

**Tier**: Free tier includes 5,000 requests/day

**Documentation**: [https://open-platform.theguardian.com/documentation/](https://open-platform.theguardian.com/documentation/)

---

### 3. New York Times API

**Purpose**: Trusted news from The New York Times

**Steps to obtain**:
1. Visit [https://developer.nytimes.com/get-started](https://developer.nytimes.com/get-started)
2. Create an account
3. Create a new app in your account dashboard
4. Enable the "Article Search API"
5. Copy your API key
6. Add to `.env` file:
   ```
   NYT_API_KEY=your_api_key_here
   ```

**Tier**: Free tier includes 4,000 requests/day (500 requests per day for Archive API)

**Documentation**: [https://developer.nytimes.com/docs/articlesearch-product/1/overview](https://developer.nytimes.com/docs/articlesearch-product/1/overview)

---

### 4. Jina AI Reader (Optional - No Key Required)

**Purpose**: Live web scraping and article extraction from any URL

**Steps to use**:
- No API key required for public endpoints
- Simply prepend any URL with `https://r.jina.ai/`
- Example: `https://r.jina.ai/https://example.com/article`
- Returns clean, LLM-friendly markdown

**Features**:
- Real-time web scraping
- Automatic content extraction
- Clean markdown output
- Works with any public URL

**Rate Limits**: Public endpoint has generous rate limits for development

**Documentation**: [https://jina.ai/reader](https://jina.ai/reader)

---

### 5. Google reCAPTCHA v2

**Purpose**: Bot protection for signup form

**Steps to obtain**:
1. Visit [https://www.google.com/recaptcha/admin/create](https://www.google.com/recaptcha/admin/create)
2. Sign in with your Google account
3. Register a new site:
   - Label: "Lift - Positive News"
   - reCAPTCHA type: Select "reCAPTCHA v2" → "I'm not a robot" Checkbox
   - Domains: Add `localhost` (for development) and `lift.news` (for production)
4. Accept the terms of service
5. Submit the form
6. Copy both keys:
   - **Site Key** (public key for the frontend)
   - **Secret Key** (private key for backend verification)
7. Add to `.env` file:
   ```
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
   RECAPTCHA_SECRET_KEY=your_secret_key_here
   ```

**Documentation**: [https://developers.google.com/recaptcha/docs/display](https://developers.google.com/recaptcha/docs/display)

---

### 6. Supabase (Already Set Up)

**Purpose**: Database for storing articles, user preferences, and analytics

**Already in `.env`**:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Next Steps**:
1. Run the `supabase-schema.sql` file in your Supabase SQL editor
2. This will create all necessary tables, indexes, and RLS policies

**Documentation**: [https://supabase.com/docs](https://supabase.com/docs)

---

## Complete .env File Template

Create a `.env` file in the root directory with the following:

```env
# Supabase (Already set up)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# NewsAPI (Required)
NEWSAPI_KEY=

# The Guardian API (Required)
GUARDIAN_API_KEY=

# New York Times API (Required)
NYT_API_KEY=

# Google reCAPTCHA v2 (Required)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Verification

After adding your keys, verify they work:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to [http://localhost:3000/news](http://localhost:3000/news)

3. Check the browser console for any API errors

4. Test each aggregator individually through the API routes:
   - `/api/news/newsapi`
   - `/api/news/guardian`
   - `/api/news/nyt`

---

## Rate Limits Summary

| Service | Free Tier Limit | Notes |
|---------|----------------|-------|
| NewsAPI | 1,000 req/day | Resets at midnight UTC |
| Guardian | 5,000 req/day | Generous limits for development |
| NYT | 4,000 req/day | 500 req/day for Archive API |
| Jina AI | Unlimited | Public endpoint, generous limits |
| Supabase | 50,000 rows | Free tier includes 500MB database |

---

## Troubleshooting

### "Invalid API Key" Errors
- Double-check there are no extra spaces in your `.env` file
- Ensure you've restarted the dev server after adding keys
- Verify the key is active in the provider's dashboard

### Rate Limit Exceeded
- Implement caching in the application (already included)
- Consider upgrading to paid tiers for production
- Use Redis or similar for distributed rate limiting

### CORS Errors
- All API calls should be made server-side in Next.js API routes
- Never expose API keys in client-side code

---

## Security Best Practices

1. ✅ Never commit `.env` file to git (already in `.gitignore`)
2. ✅ Use environment variables in Vercel for production
3. ✅ Rotate API keys periodically
4. ✅ Set up rate limiting on API routes
5. ✅ Monitor API usage in provider dashboards