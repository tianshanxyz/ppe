import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib'

export interface ComplianceReportData {
  productName: string
  targetMarket: string
  checkDate: string
  requirements: Array<{
    category: string
    items: string[]
  }>
  estimatedCost: {
    min: number
    max: number
    currency: string
  }
  estimatedDays: {
    min: number
    max: number
  }
  certifications: string[]
  standards: string[]
  notes?: string
}

export async function generateComplianceReportPDF(
  data: ComplianceReportData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792]) // Letter size
  const { width, height } = page.getSize()

  // Load fonts
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Colors
  const primaryColor = rgb(0.2, 0.6, 0.6) // #339999
  const darkColor = rgb(0.2, 0.2, 0.2)
  const grayColor = rgb(0.5, 0.5, 0.5)
  const lightGrayColor = rgb(0.95, 0.95, 0.95)

  let y = height - 50

  // Header
  page.drawText('MDLooker PPE Compliance Report', {
    x: 50,
    y,
    size: 24,
    font: helveticaBold,
    color: primaryColor,
  })

  y -= 30

  // Report Date
  page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
    x: 50,
    y,
    size: 10,
    font: helvetica,
    color: grayColor,
  })

  y -= 40

  // Product Info Section
  page.drawRectangle({
    x: 50,
    y: y - 80,
    width: width - 100,
    height: 80,
    color: lightGrayColor,
  })

  page.drawText('Product Information', {
    x: 60,
    y: y - 20,
    size: 14,
    font: helveticaBold,
    color: darkColor,
  })

  page.drawText(`Product: ${data.productName}`, {
    x: 60,
    y: y - 40,
    size: 11,
    font: helvetica,
    color: darkColor,
  })

  page.drawText(`Target Market: ${data.targetMarket}`, {
    x: 60,
    y: y - 55,
    size: 11,
    font: helvetica,
    color: darkColor,
  })

  page.drawText(`Check Date: ${data.checkDate}`, {
    x: 60,
    y: y - 70,
    size: 11,
    font: helvetica,
    color: darkColor,
  })

  y -= 100

  // Requirements Section
  page.drawText('Compliance Requirements', {
    x: 50,
    y,
    size: 16,
    font: helveticaBold,
    color: primaryColor,
  })

  y -= 25

  for (const section of data.requirements) {
    // Check if we need a new page
    if (y < 150) {
      const newPage = pdfDoc.addPage([612, 792])
      y = newPage.getSize().height - 50
    }

    page.drawText(section.category, {
      x: 50,
      y,
      size: 12,
      font: helveticaBold,
      color: darkColor,
    })

    y -= 18

    for (const item of section.items) {
      // Check if we need a new page
      if (y < 100) {
        const newPage = pdfDoc.addPage([612, 792])
        y = newPage.getSize().height - 50
      }

      // Draw bullet point
      page.drawText('•', {
        x: 60,
        y,
        size: 10,
        font: helvetica,
        color: primaryColor,
      })

      // Wrap text if too long
      const words = item.split(' ')
      let line = ''
      let lineY = y

      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word
        const textWidth = helvetica.widthOfTextAtSize(testLine, 10)

        if (textWidth > width - 130 && line) {
          page.drawText(line, {
            x: 75,
            y: lineY,
            size: 10,
            font: helvetica,
            color: darkColor,
          })
          line = word
          lineY -= 14
        } else {
          line = testLine
        }
      }

      if (line) {
        page.drawText(line, {
          x: 75,
          y: lineY,
          size: 10,
          font: helvetica,
          color: darkColor,
        })
      }

      y = lineY - 10
    }

    y -= 10
  }

  // New page for cost and timeline
  const costPage = pdfDoc.addPage([612, 792])
  y = costPage.getSize().height - 50

  // Cost Estimate Section
  costPage.drawText('Cost & Timeline Estimate', {
    x: 50,
    y,
    size: 16,
    font: helveticaBold,
    color: primaryColor,
  })

  y -= 30

  // Cost box
  costPage.drawRectangle({
    x: 50,
    y: y - 60,
    width: 250,
    height: 60,
    color: lightGrayColor,
  })

  costPage.drawText('Estimated Cost', {
    x: 60,
    y: y - 20,
    size: 12,
    font: helveticaBold,
    color: darkColor,
  })

  costPage.drawText(
    `${data.estimatedCost.currency} ${data.estimatedCost.min.toLocaleString()} - ${data.estimatedCost.max.toLocaleString()}`,
    {
      x: 60,
      y: y - 40,
      size: 14,
      font: helveticaBold,
      color: primaryColor,
    }
  )

  // Timeline box
  costPage.drawRectangle({
    x: 320,
    y: y - 60,
    width: 250,
    height: 60,
    color: lightGrayColor,
  })

  costPage.drawText('Estimated Timeline', {
    x: 330,
    y: y - 20,
    size: 12,
    font: helveticaBold,
    color: darkColor,
  })

  costPage.drawText(
    `${data.estimatedDays.min} - ${data.estimatedDays.max} days`,
    {
      x: 330,
      y: y - 40,
      size: 14,
      font: helveticaBold,
      color: primaryColor,
    }
  )

  y -= 90

  // Certifications Section
  if (data.certifications.length > 0) {
    costPage.drawText('Required Certifications', {
      x: 50,
      y,
      size: 14,
      font: helveticaBold,
      color: darkColor,
    })

    y -= 20

    costPage.drawText(data.certifications.join(', '), {
      x: 50,
      y,
      size: 10,
      font: helvetica,
      color: grayColor,
    })

    y -= 30
  }

  // Standards Section
  if (data.standards.length > 0) {
    costPage.drawText('Applicable Standards', {
      x: 50,
      y,
      size: 14,
      font: helveticaBold,
      color: darkColor,
    })

    y -= 20

    costPage.drawText(data.standards.join(', '), {
      x: 50,
      y,
      size: 10,
      font: helvetica,
      color: grayColor,
    })

    y -= 30
  }

  // Notes Section
  if (data.notes) {
    costPage.drawText('Additional Notes', {
      x: 50,
      y,
      size: 14,
      font: helveticaBold,
      color: darkColor,
    })

    y -= 20

    // Wrap notes text
    const noteWords = data.notes.split(' ')
    let noteLine = ''
    let noteY = y

    for (const word of noteWords) {
      const testLine = noteLine + (noteLine ? ' ' : '') + word
      const textWidth = helvetica.widthOfTextAtSize(testLine, 10)

      if (textWidth > width - 100 && noteLine) {
        costPage.drawText(noteLine, {
          x: 50,
          y: noteY,
          size: 10,
          font: helvetica,
          color: grayColor,
        })
        noteLine = word
        noteY -= 14
      } else {
        noteLine = testLine
      }
    }

    if (noteLine) {
      costPage.drawText(noteLine, {
        x: 50,
        y: noteY,
        size: 10,
        font: helvetica,
        color: grayColor,
      })
    }
  }

  // Footer on all pages
  const pages = pdfDoc.getPages()
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    page.drawText(`Page ${i + 1} of ${pages.length}`, {
      x: width - 100,
      y: 30,
      size: 9,
      font: helvetica,
      color: grayColor,
    })

    page.drawText('© 2026 MDLooker - PPE Compliance Platform', {
      x: 50,
      y: 30,
      size: 9,
      font: helvetica,
      color: grayColor,
    })
  }

  return await pdfDoc.save()
}

export function downloadPDF(pdfBytes: Uint8Array, filename: string) {
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
