


export const config = {
	logicalWidth: 1080,
	logicalHeight: 1920,
	scaleFactor: 1,
    minScaleFactor : 1,
	get topY() : number
	{
		return (window.innerHeight - (this.logicalHeight * this.scaleFactor))/2;
	},
	get bottomY() : number
	{
		return window.innerHeight - this.topY;
	},
	get leftX() : number
	{
		return (window.innerWidth - (this.logicalWidth * this.scaleFactor))/2;
	},
	get rightX() : number
	{
		return window.innerWidth - this.leftX;
	},
    get minTopY() : number
	{
		return (window.innerHeight - (this.logicalHeight * this.minScaleFactor))/2;
	},
	get minBottomY() : number
	{
		return window.innerHeight - this.minTopY;
	},
	get minLeftX() : number
	{
		return (window.innerWidth - (this.logicalWidth * this.minScaleFactor))/2;
	},
	get minRightX() : number
	{
		return window.innerWidth - this.leftX;
	}
}

export const CalculateScaleFactor = () => {
    const maxScaleFactor = Math.max(
        window.innerWidth/config.logicalWidth,
        window.innerHeight/config.logicalHeight,
    );

    const minScaleFactor = Math.min(
        window.innerWidth/config.logicalWidth,
        window.innerHeight/config.logicalHeight,
    );

    config.scaleFactor = maxScaleFactor;
    config.minScaleFactor = minScaleFactor;

};