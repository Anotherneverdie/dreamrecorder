import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 注意：这里的 params 类型被改成了 Promise，适配 Next.js 15 新特性
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  // 1. 必须使用 await 等待 params 解析完成，否则 Next.js 15 会报 Type Error
  const { filename } = await params;
  
  // 2. 采用标准的 process.cwd() 相对路径定位到你的紫色持久化挂载盘
  const filePath = path.join(process.cwd(), 'public', 'generated', filename);

  // 3. 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    return new NextResponse('Image not found', { status: 404 });
  }

  // 4. 读取文件流
  const fileBuffer = fs.readFileSync(filePath);
  
  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
