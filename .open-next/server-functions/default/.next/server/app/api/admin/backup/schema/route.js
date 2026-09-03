(()=>{var a={};a.id=5162,a.ids=[5162],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},28354:a=>{"use strict";a.exports=require("util")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},35513:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>E,patchFetch:()=>D,routeModule:()=>z,serverHooks:()=>C,workAsyncStorage:()=>A,workUnitAsyncStorage:()=>B});var d={};c.r(d),c.d(d,{GET:()=>y,dynamic:()=>w});var e=c(95736),f=c(9117),g=c(4044),h=c(39326),i=c(32324),j=c(261),k=c(54290),l=c(85328),m=c(38928),n=c(46595),o=c(3421),p=c(17679),q=c(41681),r=c(63446),s=c(86439),t=c(51356),u=c(10641),v=c(47025);let w="force-dynamic",x=`-- ============================================================
-- Ony Platform — PostgreSQL Database Schema (DDL Only)
-- Import this to create a fresh empty database for Ony v2
-- Run this in Supabase SQL Editor AFTER creating a new project
-- ============================================================

-- ── Enable UUID extension ─────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. users ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT UNIQUE NOT NULL,
  name         TEXT,
  avatar_url   TEXT,
  role         TEXT NOT NULL DEFAULT 'user',  -- 'user' | 'admin' | 'superadmin'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users (role);

-- ── 2. cards ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activation_code TEXT UNIQUE NOT NULL,
  user_id         UUID REFERENCES users (id) ON DELETE SET NULL,
  card_name       TEXT NOT NULL DEFAULT 'NFC + QR Smart Media',
  media_type      TEXT NOT NULL DEFAULT 'nfc_qr', -- 'nfc_qr' | 'qr_only' | 'nfc_only'
  status          TEXT NOT NULL DEFAULT 'unclaimed', -- 'unclaimed' | 'active' | 'suspended'
  mode            TEXT NOT NULL DEFAULT 'profile',   -- 'profile' | 'redirect'
  redirect_url    TEXT,         -- NULL = paid; 'UNPAID' = belum bayar; URL = redirect mode
  payment_status  TEXT DEFAULT 'paid',
  total_taps      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cards_activation_code ON cards (activation_code);
CREATE INDEX IF NOT EXISTS idx_cards_user_id         ON cards (user_id);
CREATE INDEX IF NOT EXISTS idx_cards_status          ON cards (status);
CREATE INDEX IF NOT EXISTS idx_cards_created_at      ON cards (created_at DESC);

-- ── 3. links ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS links (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id   UUID REFERENCES cards (id) ON DELETE CASCADE,
  user_id   UUID REFERENCES users (id) ON DELETE CASCADE,
  type      TEXT,        -- 'url' | 'phone' | 'email' | 'instagram' | etc.
  url       TEXT,
  label     TEXT,
  icon_type TEXT,
  "order"   INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_links_card_id ON links (card_id);
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links (user_id);

-- ── 4. tap_logs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tap_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id    UUID REFERENCES cards (id) ON DELETE CASCADE,
  ip         TEXT,
  user_agent TEXT,
  country    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tap_logs_card_id    ON tap_logs (card_id);
CREATE INDEX IF NOT EXISTS idx_tap_logs_created_at ON tap_logs (created_at DESC);

-- ── 5. orders ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users (id) ON DELETE SET NULL,
  card_id        UUID REFERENCES cards (id) ON DELETE SET NULL,
  amount         BIGINT NOT NULL DEFAULT 0,  -- in IDR (rupiah)
  status         TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'paid' | 'failed' | 'expired'
  payment_method TEXT,
  external_id    TEXT,   -- payment gateway order ID
  snap_token     TEXT,   -- Midtrans snap token
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id    ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

-- ── 6. admin_audit_logs ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    TEXT NOT NULL,
  action      TEXT NOT NULL,     -- e.g. 'DELETE_CARDS' | 'DATABASE_BACKUP'
  target_type TEXT,              -- e.g. 'CARD' | 'USER' | 'SYSTEM'
  target_id   TEXT,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin_id   ON admin_audit_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_action     ON admin_audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON admin_audit_logs (created_at DESC);

-- ── 7. admin_settings ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Auto-update updated_at trigger ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_cards
    BEFORE UPDATE ON cards
    FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_orders
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Row Level Security (RLS) ──────────────────────────────────────────────────
-- Enable RLS on all tables (service role bypasses these)
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards             ENABLE ROW LEVEL SECURITY;
ALTER TABLE links             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tap_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings    ENABLE ROW LEVEL SECURITY;

-- Public read for active cards (for QR redirect)
CREATE POLICY IF NOT EXISTS "public_read_active_cards"
  ON cards FOR SELECT
  USING (status = 'active');

-- ── Done ──────────────────────────────────────────────────────────────────────
-- After running this script:
-- 1. Set environment variables in your new project (.env.local / Vercel)
-- 2. Configure ADMIN_EMAIL, NEXTAUTH_SECRET, NEXTAUTH_URL
-- 3. Configure Supabase URL + keys
-- 4. Deploy and test
`;async function y(a){if(!(a=>{if(!a)return!1;let b=process.env.ADMIN_EMAIL?.toLowerCase().trim();return!!b&&"string"==typeof a.email&&a.email.toLowerCase().trim()===b||"admin"===a.role||"superadmin"===a.role})(await (0,v.getToken)({req:a,secret:process.env.NEXTAUTH_SECRET})))return u.NextResponse.json({error:"Forbidden"},{status:403});let b=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19),c=`ony_schema_${b}.sql`;return new u.NextResponse(x,{status:200,headers:{"Content-Type":"application/sql","Content-Disposition":`attachment; filename="${c}"`,"Cache-Control":"no-store"}})}let z=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/admin/backup/schema/route",pathname:"/api/admin/backup/schema",filename:"route",bundlePath:"app/api/admin/backup/schema/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"D:\\CODING\\Ony\\src\\app\\api\\admin\\backup\\schema\\route.ts",nextConfigOutput:"standalone",userland:d}),{workAsyncStorage:A,workUnitAsyncStorage:B,serverHooks:C}=z;function D(){return(0,g.patchFetch)({workAsyncStorage:A,workUnitAsyncStorage:B})}async function E(a,b,c){var d;let e="/api/admin/backup/schema/route";"/index"===e&&(e="/");let g=await z.prepare(a,b,{srcPage:e,multiZoneDraftMode:!1});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:u,params:v,nextConfig:w,isDraftMode:x,prerenderManifest:y,routerServerContext:A,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,resolvedPathname:D}=g,E=(0,j.normalizeAppPath)(e),F=!!(y.dynamicRoutes[E]||y.routes[D]);if(F&&!x){let a=!!y.routes[D],b=y.dynamicRoutes[E];if(b&&!1===b.fallback&&!a)throw new s.NoFallbackError}let G=null;!F||z.isDev||x||(G="/index"===(G=D)?"/":G);let H=!0===z.isDev||!F,I=F&&!H,J=a.method||"GET",K=(0,i.getTracer)(),L=K.getActiveScopeSpan(),M={params:v,prerenderManifest:y,renderOpts:{experimental:{cacheComponents:!!w.experimental.cacheComponents,authInterrupts:!!w.experimental.authInterrupts},supportsDynamicResponse:H,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=w.experimental)?void 0:d.cacheLife,isRevalidate:I,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>z.onRequestError(a,b,d,A)},sharedContext:{buildId:u}},N=new k.NodeNextRequest(a),O=new k.NodeNextResponse(b),P=l.NextRequestAdapter.fromNodeNextRequest(N,(0,l.signalFromNodeResponse)(b));try{let d=async c=>z.handle(P,M).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=K.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${J} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${J} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&B&&C&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=M.renderOpts.fetchMetrics;let i=M.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=M.renderOpts.collectedTags;if(!F)return await (0,o.I)(N,O,e,M.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==M.renderOpts.collectedRevalidate&&!(M.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&M.renderOpts.collectedRevalidate,d=void 0===M.renderOpts.collectedExpire||M.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:M.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await z.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:B})},A),b}},l=await z.handleResponse({req:a,nextConfig:w,cacheKey:G,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:y,isRoutePPREnabled:!1,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,responseGenerator:k,waitUntil:c.waitUntil});if(!F)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",B?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),x&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&F||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.getCacheControlHeader)(l.cacheControl)),await (0,o.I)(N,O,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};L?await g(L):await K.withPropagatedContext(a.headers,()=>K.trace(m.BaseServerSpan.handleRequest,{spanName:`${J} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":J,"http.target":a.url}},g))}catch(b){if(b instanceof s.NoFallbackError||await z.onRequestError(a,b,{routerKind:"App Router",routePath:E,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:B})}),F)throw b;return await (0,o.I)(N,O,new Response(null,{status:500})),null}}},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},55511:a=>{"use strict";a.exports=require("crypto")},55591:a=>{"use strict";a.exports=require("https")},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},74075:a=>{"use strict";a.exports=require("zlib")},78335:()=>{},79428:a=>{"use strict";a.exports=require("buffer")},81630:a=>{"use strict";a.exports=require("http")},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},94735:a=>{"use strict";a.exports=require("events")},96487:()=>{}};var b=require("../../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[4996,1692,7025],()=>b(b.s=35513));module.exports=c})();