// 認証ミドルウェア（シンプルなBasic Auth + クッキーセッション）
// 環境変数 SALESGATE_PASSWORD を設定した場合のみ認証が有効になる
// 設定しない場合はローカル運用向けに全ルートを開放する
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PASSWORD = process.env.SALESGATE_PASSWORD;
const AUTH_COOKIE = "salesgate-auth";

export function middleware(request: NextRequest) {
  // パスワード未設定 = 認証無効（ローカル運用）
  if (!PASSWORD) return NextResponse.next();

  // クッキーで認証済みなら通過
  const cookie = request.cookies.get(AUTH_COOKIE)?.value;
  if (cookie === PASSWORD) return NextResponse.next();

  // Basic認証ヘッダーを検証
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    try {
      const decoded = Buffer.from(auth.slice(6), "base64").toString("utf-8");
      const [, pass] = decoded.split(":");
      if (pass === PASSWORD) {
        const res = NextResponse.next();
        res.cookies.set(AUTH_COOKIE, PASSWORD, {
          httpOnly: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7日間
        });
        return res;
      }
    } catch {
      // デコード失敗は認証失敗として扱う
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="SalesGate"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
