import Candy from "./Candy";

export default class MatchFinder 
{      
    static empty(board, size)
    {
        for (let i = 0; i < size; i++) 
            for (let j = 0; j < size; j++) 
                if (!board[i][j])
                    return true;
        return false;
    }

    checkValid(board, size) 
    {
        for (let i = 0; i < size; i++) 
            for (let j = 0; j < size; j++) 
                if (!board[i][j])
                    return false;
        for (let i = 0; i < size; i++) 
        {
            for (let j = 0; j < size - 2; j++) 
            {
                let candy1 = board[i][j + 0];
                let candy2 = board[i][j + 1];
                let candy3 = board[i][j + 2];
                if (Candy.sameColor(candy1, candy2) && Candy.sameColor(candy2, candy3))
                    return true;
            }
        }

        for (let j = 0; j < size; j++) 
        {
            for (let i = 0; i < size - 2; i++)
            {
                let candy1 = board[i + 0][j];
                let candy2 = board[i + 1][j];
                let candy3 = board[i + 2][j];
                if (Candy.sameColor(candy1, candy2) && Candy.sameColor(candy2, candy3))
                    return true;
            }
        }

        return false;
    }
    
    static collectExplosion(candy, grid, size, toDestroy) 
    {
        if (!candy || toDestroy.has(candy)) 
            return;

        toDestroy.add(candy);

        if (candy.special === "striped-horizontal") 
        {
            for (let c = 0; c < size; c++)
                this.collectExplosion(grid[candy.row][c], grid, size, toDestroy);
        } 
        else if (candy.special === "striped-vertical") 
        {
            for (let r = 0; r < size; r++)
                    this.collectExplosion(grid[r][candy.col], grid, size, toDestroy);
        } 
        else if (candy.special === "wrapped") 
        {
            let rStart = Math.max(0, candy.row - 1);
            let rEnd = Math.min(size - 1, candy.row + 1);
            let cStart = Math.max(0, candy.col - 1);
            let cEnd = Math.min(size - 1, candy.col + 1);

            for (let r = rStart; r <= rEnd; r++)
                for (let c = cStart; c <= cEnd; c++)
                    this.collectExplosion(grid[r][c], grid, size, toDestroy);
        }
        else if (candy.special === "choco")
        {
            for (let r = 0; r < size; r++)
                for (let c = 0; c < size; c++)
                    if (grid[r][c].type === candy.type)
                        this.collectExplosion(grid[r][c], grid, size, toDestroy);

        }
    }

    static find(board, size, priorityTargets = []) 
    {
        let toDestroy = new Set();
        let specialsToSpawn = [];

        for (let r = 0; r < size; r++) 
        {
            for (let c = 0; c < size; c++) 
            {
                let candy = board[r][c];
                if (!candy || candy.check) 
                    continue;

                let h = this.getHorizontalRange(r, c, board, size);
                let v = this.getVerticalRange(r, c, board, size);
                
                let hLen = h.right - h.left + 1;
                let vLen = v.bottom - v.top + 1;

                let type = null;

                if (hLen >= 3 || vLen >= 3) 
                {
                    let spawnR = r;
                    let spawnC = c;

                    for (let target of priorityTargets) 
                    {
                        if (!target) continue;
                        
                        const inH = (r === target.row && target.col >= h.left && target.col <= h.right);
                        const inV = (c === target.col && target.row >= v.top && target.row <= v.bottom);

                        if ((hLen >= 3 && inH) || (vLen >= 3 && inV)) 
                        {
                            spawnR = target.row;
                            spawnC = target.col;
                            let hh = this.getHorizontalRange(spawnR, spawnC, board, size);
                            let vv = this.getVerticalRange(spawnR, spawnC, board, size);

                            let hhLen = hh.right - hh.left + 1;
                            let vvLen = vv.bottom - vv.top + 1;

                            if (hhLen >= 3 && vvLen >= 3) 
                                type = "wrapped";
                        }
                    }
                    console.log(hLen);
                    console.log(vLen);
                    console.log(spawnR + " " + spawnC);
                    if (hLen >= 5 || vLen >= 5) 
                        type = "choco";
                    else if (hLen >= 3 && vLen >= 3) 
                        type = "wrapped";
                    else if (hLen === 4) 
                        type = "striped-vertical"; 
                    else if (vLen === 4) 
                        type = "striped-horizontal";

                    if (type)
                    {
                        specialsToSpawn.push({ r: spawnR, c: spawnC, type });
                    }

                    if (hLen >= 3) 
                    {
                        for (let i = h.left; i <= h.right; i++) 
                        {
                            board[r][i].check = true;
                            this.collectExplosion(board[r][i], board, size, toDestroy);
                        }
                    }
                    if (vLen >= 3) 
                    {
                        for (let i = v.top; i <= v.bottom; i++) 
                        {
                            board[i][c].check = true;
                            this.collectExplosion(board[i][c], board, size, toDestroy);
                        }
                    }
                }
            }
        }

        specialsToSpawn.forEach(s => 
        {
            let candy = board[s.r][s.c];
            if (candy) 
            {
                toDestroy.delete(board[s.r][s.c]);
                candy.special = s.type;
                candy.refresh();
                toDestroy.delete(candy);
            }
        });

        toDestroy.forEach(candy => 
        {
            
            if (candy.special === null || candy.special === undefined || !specialsToSpawn.some(s => s.r === candy.row && s.c === candy.col)) 
            {
                board[candy.row][candy.col] = null;
                candy.destroy();
            }
        });
        
        for (let r = 0; r < size; r++)
            for (let c = 0; c < size; c++)
                if (board[r][c]) board[r][c].check = false;

        return toDestroy;
    }

    static check(board, size, r, c, priorityTargets = [])
    {
        let toDestroy = new Set();
        let candy = board[r][c];

        if (!candy || candy.check) 
            return;

        let h = this.getHorizontalRange(r, c, board, size);
        let v = this.getVerticalRange(r, c, board, size);
        
        let hLen = h.right - h.left + 1;
        let vLen = v.bottom - v.top + 1;

        let type = null;

        if (hLen >= 3 || vLen >= 3) 
        {
            let spawnR = r;
            let spawnC = c;

            for (let target of priorityTargets) 
            {
                if (!target) continue;
                
                const inH = (r === target.row && target.col >= h.left && target.col <= h.right);
                const inV = (c === target.col && target.row >= v.top && target.row <= v.bottom);

                if ((hLen >= 3 && inH) || (vLen >= 3 && inV)) 
                {
                    spawnR = target.row;
                    spawnC = target.col;
                }
            }

            if (hLen >= 3) 
            {
                for (let i = h.left; i <= h.right; i++) 
                {
                    board[r][i].check = true;
                    toDestroy.add(board[r][i]);
                }
            }
            if (vLen >= 3) 
            {
                for (let i = v.top; i <= v.bottom; i++) 
                {
                    board[i][c].check = true;
                    toDestroy.add(board[i][c]);
                }
            }
        }
        return toDestroy;
    }

    static getHorizontalRange(r, c, board, size) 
    {
        let left = c, right = c;
        while (left - 1 >= 0 && Candy.sameColor(board[r][left - 1], board[r][c])) 
            left--;
        while (right + 1 < size && Candy.sameColor(board[r][right + 1], board[r][c]))
            right++;
        return {left, right};
    }

    static getVerticalRange(r, c, board, size) 
    {
        let top = r, bottom = r;
        while (top - 1 >= 0 && Candy.sameColor(board[top - 1][c], board[r][c])) 
            top--;
        while (bottom + 1 < size && Candy.sameColor(board[bottom + 1][c], board[r][c])) 
            bottom++;
        return {top, bottom};
    }
}