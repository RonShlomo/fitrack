import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'

// GET - קבלת כל התרגילים
export async function GET() {
    try {
        const client = await clientPromise
        const db = client.db('fitrack')
        const exercises = await db.collection('exercises').find({}).toArray()

        return NextResponse.json({ success: true, data: exercises })
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

// POST - הוספת תרגיל חדש
export async function POST(request) {
    try {
        const body = await request.json()
        const { description, weight } = body

        if (!description || weight === undefined) {
            return NextResponse.json({ success: false, error: 'חסרים נתונים' }, { status: 400 })
        }

        const client = await clientPromise
        const db = client.db('fitrack')

        const newExercise = {
            description,
            weight: parseFloat(weight),
            createdAt: new Date(),
            id: Date.now() // נשמור גם ID זמני לתאימות
        }

        const result = await db.collection('exercises').insertOne(newExercise)

        return NextResponse.json({
            success: true,
            data: { ...newExercise, _id: result.insertedId }
        })
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

// PUT - עדכון תרגיל
export async function PUT(request) {
    try {
        const body = await request.json()
        const { id, description, weight } = body

        const client = await clientPromise
        const db = client.db('fitrack')

        const result = await db.collection('exercises').updateOne(
            { id: parseInt(id) },
            {
                $set: {
                    description,
                    weight: parseFloat(weight),
                    updatedAt: new Date()
                }
            }
        )

        if (result.matchedCount === 0) {
            return NextResponse.json({ success: false, error: 'תרגיל לא נמצא' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

// DELETE - מחיקת תרגיל
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        const client = await clientPromise
        const db = client.db('fitrack')

        const result = await db.collection('exercises').deleteOne({ id: parseInt(id) })

        if (result.deletedCount === 0) {
            return NextResponse.json({ success: false, error: 'תרגיל לא נמצא' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}