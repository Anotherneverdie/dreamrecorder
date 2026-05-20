import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  // 1. 拿到文件名
  const { filename } = await params;
  
  // 2. 极其粗暴且精准：直接去 Linux 系统的根目录找你挂载的紫色硬盘路径！
// ✅ 改成这个，和 image-gen.ts 保持一致
const filePath = path.join(process.cwd(), 'public', 'generated', filename);

  // 3. 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    return new NextResponse(`Image not found at ${filePath}`, { status: 404 });
  }

  // 4. 存在就读取并返回
  const fileBuffer = fs.readFileSync(filePath);
  
  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}