import Candy from "./Candy.js";

export default class Gravity 
{
    static slideCandy(board, size) 
    {
        let cnt = 0;
        for (let c = 0; c < size; c++)
        {
            let ind = size - 1;
            for (let r = size - 1; r >= 0; r--)
            {
                const candy = board[r][c];
                if (!candy) 
                    continue;
                if (board[r][c])
                {
                    if (r !== ind)
                    {
                        board[ind][c] = candy;
                        board[r][c] = null;

                        candy.row = ind;
                        candy.col = c;
                        cnt ++;
                        candy.move();
                    }
                    ind --;
                }
            }

            // for (let r = ind; r >= 0; r--)
            // {
            //     board[r][c].destroy();
            //     board[r][c] = null;
            // }
        }

        return cnt;
    }


    static generateCandy(scene, board, size, types)
    {
        for (let r = 0; r < size; r++) 
        {
            for (let c = 0; c < size; c++) 
            {
                if (!board[r][c]) 
                {
                    let t = Phaser.Math.Between(0, types - 1);
                    board[r][c] = new Candy(scene, r, c, t, null);
                }
            }
        }
    }

    static checkValid(board, size) 
    {
        for (let i = 0; i < size; i++)
            for (let j = 0; j < size; j++) 
                if (!board[i][j])
                    return false

        return true;
    }
}
