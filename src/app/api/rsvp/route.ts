import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";

export async function POST(request: Request) {
  const body = await request.json();
  const client = await clientPromise; 
  const db = client.db("wedding");
  const collection = db.collection("guests");

  const result = await collection.insertOne({
    name: body.name,
    email: body.email,
    attending: body.attending,
  });

  return NextResponse.json({ success: true, id: result.insertedId });
}

export async function GET() {
  const client = await clientPromise;
  const db = client.db("wedding");
  const collection = db.collection("guests");

  const guests = await collection.find().toArray();
  return NextResponse.json(guests);
}
