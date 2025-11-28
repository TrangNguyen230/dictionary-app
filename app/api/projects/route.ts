// app/api/projects/route.ts
// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { terms: true },
      },
    },
  });

  // map sang format đơn giản hơn cho frontend
  const mapped = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    termCount: p._count.terms,
  }));

  return NextResponse.json(mapped);
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

  if (body.action === 'update-project') {
    const { id, name, description } = body;
    if (!id || !name) {
      return NextResponse.json(
        { message: 'Thiếu dữ liệu cập nhật' },
        { status: 400 },
      );
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        name,
        description: description ?? null,
      },
    });

    return NextResponse.json(updated);
  }

  if (body.action === 'delete-project') {
    const { id } = body;
    if (!id) {
      return NextResponse.json({ message: 'Thiếu id' }, { status: 400 });
    }

    // bỏ liên kết projectId của các term thuộc dự án này
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
