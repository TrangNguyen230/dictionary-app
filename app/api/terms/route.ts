// app/api/terms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const projectId = searchParams.get('projectId');

  const where: any = {};

  if (q) {
    where.OR = [
      { term: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { extraTags: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (projectId) {
    where.projectId = Number(projectId);
  }

  const terms = await prisma.term.findMany({
    where,
    include: { project: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(terms);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === 'create-term') {
    const { term, description, projectId, extraTags } = body;

    if (!term || !description) {
      return NextResponse.json(
        { message: 'Thiếu trường bắt buộc' },
        { status: 400 },
      );
    }

    const created = await prisma.term.create({
      data: {
        term,
        description,
        projectId: projectId ?? null,
        extraTags: extraTags ?? null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  }

  if (body.action === 'update-term') {
    const { id, term, description, projectId, extraTags } = body;
    if (!id || !term || !description) {
      return NextResponse.json(
        { message: 'Thiếu dữ liệu cập nhật' },
        { status: 400 },
      );
    }

    const updated = await prisma.term.update({
      where: { id },
      data: {
        term,
        description,
        projectId: projectId ?? null,
        extraTags: extraTags ?? null,
      },
    });

    return NextResponse.json(updated);
  }

  if (body.action === 'delete-term') {
    const { id } = body;
    if (!id) {
      return NextResponse.json({ message: 'Thiếu id' }, { status: 400 });
    }

    await prisma.term.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ message: 'Action không hỗ trợ' }, { status: 400 });
}
