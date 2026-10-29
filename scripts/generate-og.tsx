import fs from "node:fs";
import path from "node:path";

import satori from "satori";
import sharp from "sharp";

import { getAllSkills } from "../src/lib/skills";

const WIDTH = 1200;
const HEIGHT = 630;
const OUT_DIR = path.join(process.cwd(), "public", "og");

const CHINESE_FONT =
  process.env.OG_FONT_PATH || "C:/Windows/Fonts/simfang.ttf";
const GEIST_REGULAR = path.join(
  process.cwd(),
  "node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf",
);
const GEIST_SEMIBOLD = path.join(
  process.cwd(),
  "node_modules/geist/dist/fonts/geist-sans/Geist-SemiBold.ttf",
);

function readFont(filePath: string): Buffer | null {
  try {
    return fs.readFileSync(filePath);
  } catch {
    return null;
  }
}

type OgProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  tags: string[];
  footer: string;
};

function template({ eyebrow, title, subtitle, tags, footer }: OgProps) {
  return (
    <div
      style={{
        width: `${WIDTH}px`,
        height: `${HEIGHT}px`,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
        padding: "64px 72px",
        boxSizing: "border-box",
        color: "#1c1917",
        fontFamily: "Geist",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 18,
          letterSpacing: "0.18em",
          color: "#78716c",
          fontFamily: "Geist",
          fontWeight: 600,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 14,
              height: 14,
              backgroundColor: "#e8590c",
            }}
          />
          <span>SKILLNOW</span>
        </div>
        <span
          style={{
            fontWeight: 400,
            letterSpacing: "0.1em",
            fontSize: 16,
          }}
        >
          AI SKILL INDEX
        </span>
      </div>

      <div
        style={{
          display: "flex",
          height: 1,
          backgroundColor: "#e7e5e4",
          marginTop: 28,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 18,
            letterSpacing: "0.16em",
            color: "#c2410c",
            textTransform: "uppercase",
            fontFamily: "Geist",
            fontWeight: 600,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "NotoSerifSC",
            fontSize: 64,
            lineHeight: 1.25,
            marginTop: 18,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              display: "flex",
              fontFamily: "NotoSerifSC",
              fontSize: 24,
              color: "#78716c",
              marginTop: 14,
            }}
          >
            {subtitle}
          </div>
        ) : null}
        {tags.length > 0 ? (
          <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
            {tags.slice(0, 4).map((tag) => (
              <div
                key={tag}
                style={{
                  display: "flex",
                  border: "1px solid #e7e5e4",
                  borderRadius: 999,
                  padding: "6px 14px",
                  fontSize: 16,
                  color: "#78716c",
                  fontFamily: "NotoSerifSC",
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid #e7e5e4",
          paddingTop: 20,
          fontSize: 16,
          color: "#78716c",
          fontFamily: "Geist",
        }}
      >
        <span>{footer}</span>
        <span>skillnow.cn</span>
      </div>
    </div>
  );
}

async function renderOg(
  props: OgProps,
  output: string,
  fonts: {
    geistRegular: Buffer;
    geistSemiBold: Buffer;
    chineseFont: Buffer;
  },
) {
  const svg = await satori(template(props), {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      {
        name: "Geist",
        data: fonts.geistRegular,
        weight: 400,
        style: "normal",
      },
      {
        name: "Geist",
        data: fonts.geistSemiBold,
        weight: 600,
        style: "normal",
      },
      {
        name: "NotoSerifSC",
        data: fonts.chineseFont,
        weight: 400,
        style: "normal",
      },
    ],
  });

  await sharp(Buffer.from(svg)).png().toFile(output);
}

async function main() {
  const chineseFont = readFont(CHINESE_FONT);
  const geistRegular = readFont(GEIST_REGULAR);
  const geistSemiBold = readFont(GEIST_SEMIBOLD);

  if (!geistRegular || !geistSemiBold) {
    console.warn("OG skipped: Geist TTF fonts not found.");
    return;
  }

  if (!chineseFont) {
    console.warn(
      `OG skipped: Chinese font not found at ${CHINESE_FONT}. Existing PNGs are kept.`,
    );
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const fontSet = { geistRegular, geistSemiBold, chineseFont };

  await renderOg(
    {
      eyebrow: "CURATED AI SKILLS",
      title: "把大师的思维方式，装进你的 AI。",
      subtitle: "整理者日常在用的 AI Skill · 开发者自用清单",
      tags: ["心理学", "哲学", "商业", "决策"],
      footer: "整理者日常在用的 AI Skill",
    },
    path.join(OUT_DIR, "default.png"),
    fontSet,
  );

  const skills = getAllSkills();
  for (const skill of skills) {
    await renderOg(
      {
        eyebrow: skill.tagLabels[0] ?? "AI SKILL",
        title: skill.shortTitle,
        subtitle: skill.title,
        tags: skill.tagLabels,
        footer: `${skill.readingLabel} · ${skill.wordCountLabel}`,
      },
      path.join(OUT_DIR, `${skill.slug}.png`),
      fontSet,
    );
  }

  console.log(`OG images written: ${skills.length + 1} files.`);
}

main().catch((error) => {
  console.error("OG generation failed:", error);
  process.exit(1);
});
