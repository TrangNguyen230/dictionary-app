// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === 'create-project') {
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { message: 'Thiếu tên dự án' },
        { status: 400 },
      );
    }

    const created = await prisma.project.create({
      data: {
        name,
        description: description ?? null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  }

  if (body.action === 'delete-project') {
    const { id } = body;
    if (!id) {
      return NextResponse.json({ message: 'Thiếu id' }, { status: 400 });
    }

    // Khi xóa project, set projectId của term về null
    await prisma.term.updateMany({
      where: { projectId: id },
      data: { projectId: null },
    });

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ message: 'Action không hỗ trợ' }, { status: 400 });
}
