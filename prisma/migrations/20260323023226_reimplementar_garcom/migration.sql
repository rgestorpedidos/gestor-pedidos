/*
  Warnings:

  - You are about to drop the column `nome` on the `PedidoItem` table. All the data in the column will be lost.
  - You are about to drop the column `preco` on the `PedidoItem` table. All the data in the column will be lost.
  - Added the required column `itemCardapioId` to the `PedidoItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nomeSnapshot` to the `PedidoItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `precoUnitario` to the `PedidoItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PedidoItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN "metodoPagamento" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PedidoItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pedidoId" TEXT NOT NULL,
    "itemCardapioId" TEXT NOT NULL,
    "nomeSnapshot" TEXT NOT NULL,
    "precoUnitario" REAL NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "observacao" TEXT,
    "opcoesSelecionadas" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ENVIADO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PedidoItem_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PedidoItem_itemCardapioId_fkey" FOREIGN KEY ("itemCardapioId") REFERENCES "ItemCardapio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PedidoItem" ("id", "pedidoId", "quantidade") SELECT "id", "pedidoId", "quantidade" FROM "PedidoItem";
DROP TABLE "PedidoItem";
ALTER TABLE "new_PedidoItem" RENAME TO "PedidoItem";
CREATE INDEX "PedidoItem_pedidoId_idx" ON "PedidoItem"("pedidoId");
CREATE INDEX "PedidoItem_itemCardapioId_idx" ON "PedidoItem"("itemCardapioId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Pedido_mesaId_idx" ON "Pedido"("mesaId");
